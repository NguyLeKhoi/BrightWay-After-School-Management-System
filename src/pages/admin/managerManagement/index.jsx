import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Alert, Box, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Person as PersonIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import { createManagerSchema, updateUserSchema } from '../../../utils/validationSchemas/userSchemas';
import userService from '../../../services/user.service';
import useFacilityBranchData from '../../../hooks/useFacilityBranchData';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { createManagerColumns } from '../../../definitions/manager/tableColumns';
import { createManagerFormFields } from '../../../definitions/manager/formFields';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../../utils/errorHandler';
import styles from './staffAndManagerManagement.module.css';

const ManagerManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  
  // Branch selection state
  const [userRoleType, setUserRoleType] = useState(null); // 'staff' or 'manager'
  
  // Fetch branch data (lazy loading - only fetch when dialog opens)
  const { branches, getBranchOptions, isLoading: branchLoading, fetchAllData } = useFacilityBranchData();

  // Use Admin CRUD hook
  const {
    data: users,
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
    selectedItem: selectedUser,
    confirmDialog,
    setConfirmDialog,
    handleCreate: baseHandleCreate,
    handleEdit: baseHandleEdit,
    handleDelete,
    handleFormSubmit: baseHandleFormSubmit,
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    handlePageChange,
    handleRowsPerPageChange,
  filters,
    updateFilter,
    loadData
  } = useBaseCRUD({
    loadFunction: async (params) => {
      return await userService.getUsersPagedByRole({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        Role: 'Manager',
        Keyword: params.Keyword || params.searchTerm || '',
        BranchId: params.branchFilter || ''
      });
    },
    createFunction: async (data) => {
      if (userRoleType === 'manager') {
        return await userService.createManager(data);
      } else {
        return await userService.createStaff(data);
      }
    },
    updateFunction: userService.updateUser,
    deleteFunction: userService.deleteUser,
    defaultFilters: { branchFilter: '' },
    loadOnMount: true
  });
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  // Override handleCreate to ensure branches are loaded
  const handleCreate = async () => {
    if (branches.length === 0) {
      await fetchAllData();
    }
    setUserRoleType('manager');
    baseHandleCreate();
  };

  // Override handleEdit to fetch expanded details if needed
  const handleEdit = async (user) => {
    const isUser = user.roles && user.roles.includes('User');
    
    if (isUser) {
      try {
        const expandedUser = await userService.getUserById(user.id, true);
        baseHandleEdit(expandedUser);
      } catch (err) {
        const errorMessage = getErrorMessage(err) || 'Có lỗi xảy ra khi lấy thông tin người dùng';
        toast.error(errorMessage, {
          autoClose: 5000,
          style: { whiteSpace: 'pre-line' }
        });
        // Still open dialog with basic user info
        baseHandleEdit(user);
      }
    } else {
      baseHandleEdit(user);
    }
  };

  // Custom form submit handler
  const handleFormSubmit = async (formData) => {
    if (dialogMode === 'create') {
      const submitData = {
        name: formData.name,
        email: formData.email,
        branchId: formData.branchId || ''
      };
      
      // Add optional fields if provided
      if (formData.phoneNumber) {
        submitData.phoneNumber = formData.phoneNumber;
      }
      if (formData.gender) {
        submitData.gender = formData.gender;
      }
      
      await baseHandleFormSubmit(submitData);
    } else {
      // Allow updating name, branchId, and isActive
      const updateData = {
        name: formData.name || selectedUser?.name || '',
        branchId: formData.branchId || selectedUser?.branchId || selectedUser?.branch?.id || null,
        isActive: formData.isActive !== undefined ? formData.isActive : (selectedUser?.isActive !== undefined ? selectedUser.isActive : true)
      };
      await baseHandleFormSubmit(updateData);
    }
  };

  const columns = useMemo(() => createManagerColumns(), []);

  const branchSelectOptions = useMemo(() => getBranchOptions(), [getBranchOptions]);

  const filteredUsers = useMemo(() => {
    if (!filters.branchFilter) return users;
    return users.filter((user) => {
      const userBranchId = user?.branchId || user?.branch?.id;
      return userBranchId === filters.branchFilter;
    });
  }, [users, filters.branchFilter]);

  const filteredTotalCount = filters.branchFilter ? filteredUsers.length : totalCount;
  const formFields = useMemo(
    () =>
      createManagerFormFields({
        dialogMode,
        actionLoading,
        branchOptions: branchSelectOptions,
        branchLoading
      }),
    [dialogMode, actionLoading, branchSelectOptions, branchLoading]
  );

  // Reload data when navigate back to this page (e.g., from create/update pages)
  useEffect(() => {
    if (location.pathname === '/admin/managers') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      loadData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className={styles.container}>
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}
      
      {/* Header */}
      <ManagementPageHeader
        title="Quản lý tài khoản Quản lý"
        createButtonText="Tạo tài khoản Quản lý"
        onCreateClick={handleCreate}
      />

      {/* Search Section */}
      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={() => {
          handleClearSearch();
          updateFilter('branchFilter', '');
        }}
        placeholder="Tìm kiếm theo tên, email..."
      >
        <Box sx={{ minWidth: 220 }}>
          <Autocomplete
            options={branchSelectOptions}
            value={branchSelectOptions.find((option) => option.value === filters.branchFilter) || null}
            onChange={(_, newValue) => updateFilter('branchFilter', newValue?.value || '')}
            getOptionLabel={(option) => option.label || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chi nhánh"
                size="small"
              />
            )}
            loading={branchLoading}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: '8px'
              }
            }}
          />
        </Box>
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
          data={filteredUsers}
          columns={columns}
          loading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredTotalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={(user) => navigate(`/admin/staffAndManager/detail/${user.id}`)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Không có người dùng nào. Hãy tạo tài khoản đầu tiên để bắt đầu."
        />
      </div>

      {/* Form Dialog */}
      <ManagementFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        mode={dialogMode}
        title="Tài khoản Quản lý"
        icon={PersonIcon}
        loading={actionLoading}
        maxWidth="sm"
      >
        <Form
          schema={dialogMode === 'create' ? createManagerSchema : updateUserSchema}
          defaultValues={
            dialogMode === 'create'
              ? {
                  name: selectedUser?.name || '',
                  email: selectedUser?.email || '',
                  branchId: selectedUser?.branchId || '',
                  isActive: selectedUser?.isActive !== undefined ? selectedUser.isActive : true
                }
              : {
                  name: selectedUser?.name || '',
                  branchId: selectedUser?.branchId || selectedUser?.branch?.id || '',
                  isActive: selectedUser?.isActive !== undefined ? selectedUser.isActive : true
                }
          }
          onSubmit={handleFormSubmit}
          submitText={dialogMode === 'create' ? 'Tạo tài khoản Quản lý' : 'Cập nhật Thông Tin'}
          loading={actionLoading}
          disabled={actionLoading}
          fields={formFields}
        />
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

export default ManagerManagement;
