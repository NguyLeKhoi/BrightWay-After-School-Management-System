import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  TextField
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {
  MeetingRoom as RoomIcon
} from '@mui/icons-material';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import { roomSchema } from '../../../utils/validationSchemas/facilitySchemas';
import roomService from '../../../services/room.service';
import userService from '../../../services/user.service';
import useFacilityBranchData from '../../../hooks/useFacilityBranchData';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { createManagerRoomColumns } from '../../../definitions/manager/room/tableColumns';
import { createManagerRoomFormFields } from '../../../definitions/manager/room/formFields';
import { toast } from 'react-toastify';
import styles from './RoomManagement.module.css';

const ManagerRoomManagement = () => {
  const navigate = useNavigate();
  const [managerBranchId, setManagerBranchId] = useState(null);


  // Convert status enum string to numeric value for backend
  const convertStatusToNumber = (status) => {
    const statusMap = {
      'Active': 1,
      'Inactive': 2,
      'UnderMaintenance': 3,
      'Closed': 4
    };
    return statusMap[status] || 1; // Default to Active
  };

  // Facility and Branch data
  const {
    facilities,
    branches,
    isLoading: isDataLoading,
    error: dataError,
    getFacilityOptions,
    getBranchOptions,
    getFacilityById,
    getBranchById,
    fetchAllData
  } = useFacilityBranchData();

  // Load manager's branch ID on mount
  useEffect(() => {
    const fetchManagerBranch = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        if (currentUser?.branchId) {
          setManagerBranchId(currentUser.branchId);
        }
        // Fetch facility and branch data for form dropdowns
        await fetchAllData();
      } catch (err) {
        console.error('Error fetching manager branch:', err);
      }
    };
    fetchManagerBranch();
  }, [fetchAllData]);

  // Create load function that always uses latest managerBranchId
  const loadRoomsFunction = useCallback(async (params) => {
    // Manager can only see rooms in their branch - always filter by managerBranchId
    if (!managerBranchId) {
      // If branchId not loaded yet, return empty result
      return { items: [], totalCount: 0, pageIndex: 1, pageSize: 10 };
    }
    
    const effectiveBranchFilter = managerBranchId; // Always use manager's branch
    
    return await roomService.getRoomsPaged(
      params.pageIndex,
      params.pageSize,
      params.Keyword || params.searchTerm || '',
      '',
      effectiveBranchFilter
    );
  }, [managerBranchId]);

  // Use Manager CRUD hook with custom load function
  const {
    data: rooms,
    totalCount,
    page,
    rowsPerPage,
    keyword,
    error,
    actionLoading,
    isPageLoading,
    loadingText,
    openDialog,
    setOpenDialog,
    dialogMode,
    selectedItem: selectedRoom,
    confirmDialog,
    setConfirmDialog,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit: baseHandleFormSubmit,
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    handlePageChange,
    handleRowsPerPageChange,
    updateFilter,
    filters,
    loadData
  } = useBaseCRUD({
    loadFunction: loadRoomsFunction,
    createFunction: async (data) => {
      // Ensure manager can only create rooms in their branch
      if (managerBranchId) {
        data.branchId = managerBranchId;
      }
      // Convert status string to numeric enum
      if (data.status) {
        data.status = convertStatusToNumber(data.status);
      }
      return await roomService.createRoom(data);
    },
    updateFunction: async (roomId, data) => {
      // Ensure manager can only update rooms in their branch
            // Convert status string to numeric enum
            if (data.status) {
              data.status = convertStatusToNumber(data.status);
            }
      if (managerBranchId) {
        data.branchId = managerBranchId;
      }
      return await roomService.updateRoom(roomId, data);
    },
    deleteFunction: roomService.deleteRoom,
    defaultFilters: {
      facilityId: '',
      branchId: ''
    },
    loadOnMount: false // Don't load on mount, wait for managerBranchId
  });

  // Reload data when managerBranchId is set
  useEffect(() => {
    if (managerBranchId && loadData) {
      loadData();
    }
  }, [managerBranchId, loadData]);

  // Override handleCreate to ensure data is loaded
  const handleCreateWithData = async () => {
    if (facilities.length === 0 && branches.length === 0) {
      await fetchAllData();
    }
    handleCreate();
  };

  // Override handleEdit to ensure data is loaded
  const handleEditWithData = async (room) => {
    if (facilities.length === 0 && branches.length === 0) {
      await fetchAllData();
    }
    handleEdit(room);
  };

  // Custom form submit handler
  const handleFormSubmit = async (data) => {
    const submitData = {
      ...data,
      branchId: managerBranchId // Always use manager's branch
    };
    await baseHandleFormSubmit(submitData);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    handleClearSearch();
    updateFilter('branchId', '');
  };

  const columns = useMemo(() => createManagerRoomColumns(styles), [styles]);
  const branchOptions = useMemo(
    () => getBranchOptions(),
    [getBranchOptions, managerBranchId]
  );

  const formFields = useMemo(
    () =>
      createManagerRoomFormFields({
        actionLoading,
        facilityOptions: getFacilityOptions(),
        managerBranchId,
        branchOptions
      }),
    [actionLoading, getFacilityOptions, managerBranchId, branchOptions]
  );

  return (
    <div className={styles.container}>
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}
      
      {/* Header */}
      <ManagementPageHeader
        title="Quản lý Phòng Học"
        createButtonText="Thêm Phòng Học"
        onCreateClick={handleCreateWithData}
      />

      {/* Search Section with Additional Filters */}
      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={handleClearFilters}
        placeholder="Tìm kiếm theo tên phòng học..."
      >
        <Box />
      </ManagementSearchSection>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className={styles.errorAlert} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <DataTable
          data={rooms}
          columns={columns}
          loading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={(room) => navigate(`/manager/rooms/detail/${room.id}`)}
          onEdit={handleEditWithData}
          onDelete={handleDelete}
          emptyMessage="Không có phòng học nào. Hãy thêm phòng học đầu tiên để bắt đầu."
        />
      </div>

      {/* Form Dialog */}
      <ManagementFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        mode={dialogMode}
        title="Phòng Học"
        icon={RoomIcon}
        loading={actionLoading}
        maxWidth="md"
      >
        {isDataLoading ? (
          <Box sx={{ textAlign: 'center', padding: '32px 0' }}>
            <Typography>Đang tải dữ liệu...</Typography>
          </Box>
        ) : dataError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dataError}
          </Alert>
        ) : (
          <Form
            schema={roomSchema}
            onSubmit={handleFormSubmit}
            fields={formFields}
            defaultValues={{
              ...selectedRoom,
              branchId: managerBranchId // Pre-fill with manager's branch
            }}
            submitText={dialogMode === 'create' ? 'Tạo Phòng Học' : 'Cập Nhật'}
            loading={actionLoading}
          />
        )}
      </ManagementFormDialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
      />
    </div>
  );
};

export default ManagerRoomManagement;
