import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessTime as SlotTypeIcon } from '@mui/icons-material';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import slotTypeService from '../../../services/slotType.service';
import userService from '../../../services/user.service';
import { createSlotTypeColumns } from '../../../definitions/slotType/tableColumns';
import { createSlotTypeFormFields } from '../../../definitions/slotType/formFields';
import { slotTypeSchema } from '../../../utils/validationSchemas/slotTypeSchemas';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './SlotTypeManagement.module.css';

const SlotTypeManagement = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const { user: authUser } = useAuth();
  const [managerBranchId, setManagerBranchId] = useState(null);

  const columns = useMemo(() => createSlotTypeColumns(), []);
  const slotTypeFormFields = useMemo(() => createSlotTypeFormFields(false), []);

  // Load manager's branch ID on mount
  useEffect(() => {
    const fetchManagerBranch = async () => {
      try {
        // Try to get branchId from auth context first
        const branchIdFromAuth = 
          authUser?.branchId ||
          authUser?.managerProfile?.branchId ||
          authUser?.managerBranchId;

        if (branchIdFromAuth) {
          setManagerBranchId(branchIdFromAuth);
          return;
        }

        // If not available in auth context, fetch from API
        const currentUser = await userService.getCurrentUser();
        const managerBranchId = 
          currentUser?.managerProfile?.branchId ||
          currentUser?.branchId ||
          currentUser?.managerBranchId ||
          null;

        if (managerBranchId) {
          setManagerBranchId(managerBranchId);
        } else {
          console.warn('Manager không có chi nhánh được gán');
        }
      } catch (err) {
        console.error('Error fetching manager branch:', err);
        showGlobalError('Không thể xác định chi nhánh. Vui lòng đăng nhập lại.');
      }
    };

    fetchManagerBranch();
  }, [authUser, showGlobalError]);

  // Create load function that always uses latest managerBranchId
  const loadSlotTypesFunction = useCallback(async (params) => {
    // If branchId not loaded yet, return empty result (will retry when branchId is loaded)
    if (!managerBranchId) {
      return { items: [], totalCount: 0, pageIndex: 1, pageSize: 10 };
    }

    return await slotTypeService.getSlotTypesPaged({
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 10,
      searchTerm: params.Keyword || params.searchTerm || '',
      branchId: managerBranchId // Always filter by manager's branch
    });
  }, [managerBranchId]);

  const {
    data: slotTypes,
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
    selectedItem: selectedSlotType,
    confirmDialog,
    setConfirmDialog,
    loadData,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit,
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    handlePageChange,
    handleRowsPerPageChange
  } = useBaseCRUD({
    loadFunction: loadSlotTypesFunction,
    createFunction: slotTypeService.createSlotType,
    updateFunction: slotTypeService.updateSlotType,
    deleteFunction: slotTypeService.deleteSlotType,
    minLoadingDuration: 300,
    loadOnMount: false // Don't auto-load, wait for branchId
  });

  // Reload data when branchId is loaded
  useEffect(() => {
    if (managerBranchId) {
      loadData(false);
    }
  }, [managerBranchId, loadData]);

  const handleViewDetail = (slotType) => {
    navigate(`/manager/slot-types/detail/${slotType.id}`);
  };

  return (
    <div className={styles.container}>
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}

      {/* Header */}
      <ManagementPageHeader
        title="Quản lý Loại Ca Giữ Trẻ"
        createButtonText="Thêm Loại Ca"
        onCreateClick={handleCreate}
      />

      {/* Search Section */}
      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={handleClearSearch}
        placeholder="Tìm kiếm theo tên loại ca..."
      />

      {/* Error Alert */}
      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <DataTable
          data={slotTypes}
          columns={columns}
          loading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={handleViewDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Không có loại ca nào. Hãy thêm loại ca đầu tiên để bắt đầu."
        />
      </div>

      {/* Form Dialog */}
      <ManagementFormDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
        }}
        mode={dialogMode}
        title="Loại Ca Giữ Trẻ"
        icon={SlotTypeIcon}
        loading={actionLoading}
        maxWidth="sm"
      >
        <Form
          schema={slotTypeSchema}
          defaultValues={{
            name: selectedSlotType?.name || '',
            description: selectedSlotType?.description || ''
          }}
          onSubmit={handleFormSubmit}
          submitText={dialogMode === 'edit' ? 'Cập nhật Loại Ca' : 'Tạo Loại Ca'}
          loading={actionLoading}
          disabled={actionLoading}
          fields={slotTypeFormFields}
        />
      </ManagementFormDialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', description: '', onConfirm: null })}
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

export default SlotTypeManagement;
