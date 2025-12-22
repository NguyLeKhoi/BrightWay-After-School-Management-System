import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import StaffAccountForm from '../../../components/AccountForms/StaffAccountForm';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import { createUserSchema, updateUserSchema } from '../../../utils/validationSchemas/userSchemas';
import userService from '../../../services/user.service';
import branchService from '../../../services/branch.service';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { createStaffAndParentColumns } from '../../../definitions/manager/staff/tableColumns';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../../utils/errorHandler';
import styles from './staffManagement.module.css';

const StaffManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = React.useRef(true);

  
  // Staff CRUD - memoize loadFunction to prevent unnecessary re-renders
  const loadStaffFunction = useCallback(async (params) => {
      return await userService.getUsersPagedByRole({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        Role: 'Staff',
        Keyword: params.Keyword || params.searchTerm || ''
      });
  }, []);
  
  const staffCrud = useBaseCRUD({
    loadFunction: loadStaffFunction,
    updateFunction: userService.updateUserByManager,
    deleteFunction: userService.deleteUserByManager,
    loadOnMount: true
  });

  // Reload data when navigate back to this page (e.g., from create pages)
  useEffect(() => {
    if (location.pathname === '/manager/staff') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      // Only reload if we're actually navigating back (not just re-rendering)
      // Use a ref to track if we've already reloaded for this pathname
      const timeoutId = setTimeout(() => {
        staffCrud.loadData(false);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  
  // Common state
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Global state
  const { showGlobalError } = useApp();
  const { user } = useAuth();
  
  // Branch options state
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  
  // Fetch branch options
  useEffect(() => {
    const fetchBranches = async () => {
      setBranchLoading(true);
      try {
        const branches = await branchService.getAllBranches();
        const options = branches.map(branch => ({
          value: branch.id,
          label: branch.branchName || branch.name || 'N/A'
        }));
        setBranchOptions(options);
      } catch (err) {

        setBranchOptions([]);
      } finally {
        setBranchLoading(false);
      }
    };
    
    fetchBranches();
  }, []);
  
  const columns = useMemo(() => createStaffAndParentColumns(), []);
  
  // Create handler
  const handleCreateStaff = () => {
    setIsSubmitting(false);
    setOpenCreateDialog(true);
  };

  // Edit handler
  const handleEditStaff = async (staff) => {
    try {
      const expandedStaff = await userService.getUserById(staff.id, true);
      staffCrud.handleEdit(expandedStaff);
      setOpenUpdateDialog(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Có lỗi xảy ra khi lấy thông tin nhân viên';
      toast.error(errorMessage);
      staffCrud.handleEdit(staff);
      setOpenUpdateDialog(true);
    }
  };

  // Delete handler
  const handleDeleteStaff = (staff) => {
    staffCrud.handleDelete(staff);
  };

  // Staff submit handler (create)
  const handleStaffSubmit = async (data) => {
    try {
      await userService.createStaff(data);
      toast.success('Tạo tài khoản Nhân viên thành công!');
      if (staffCrud.loadData) {
        staffCrud.loadData(false);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Có lỗi xảy ra khi tạo tài khoản';
      setError(errorMessage);
      showGlobalError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
      throw err;
    }
  };

  // Staff update submit handler
  const handleStaffUpdateSubmit = async (formData) => {
    if (!staffCrud.selectedItem) return;
    
    const updateData = {
      name: formData.name || staffCrud.selectedItem?.name || '',
      isActive: formData.isActive !== undefined ? formData.isActive : (staffCrud.selectedItem?.isActive !== undefined ? staffCrud.selectedItem.isActive : true)
    };
    
    await staffCrud.handleFormSubmit(updateData);
  };

  // Form fields for update (similar to admin)
  const updateFormFields = useMemo(() => [
    {
      section: 'Thông tin cá nhân',
      sectionDescription: 'Cập nhật thông tin hiển thị của nhân viên.',
      name: 'name',
      label: 'Họ và Tên',
      type: 'text',
      required: true,
      placeholder: 'Ví dụ: Nguyễn Văn A',
      disabled: staffCrud.actionLoading,
      gridSize: 6
    },
    {
      name: 'isActive',
      label: 'Trạng thái hoạt động',
      type: 'switch',
      disabled: staffCrud.actionLoading,
      gridSize: 6
    }
  ], [staffCrud.actionLoading]);
  
  return (
    <div className={styles.container}>
      {staffCrud.isPageLoading && <ContentLoading isLoading={staffCrud.isPageLoading} text={staffCrud.loadingText} />}
      
      {/* Header */}
      <ManagementPageHeader
        title="Quản lý Nhân Viên"
        createButtonText="Tạo Nhân Viên"
        onCreateClick={handleCreateStaff}
      />

      {/* Error Alert */}
      {(error || staffCrud.error) && (
        <Alert 
          severity="error" 
          className={styles.errorAlert} 
          onClose={() => {
            setError(null);
          }}
        >
          {error || staffCrud.error}
        </Alert>
      )}

      {/* Content */}
      <Box sx={{ mt: 2 }}>
            <ManagementSearchSection
          keyword={staffCrud.keyword}
          onKeywordChange={staffCrud.handleKeywordChange}
          onSearch={staffCrud.handleKeywordSearch}
          onClear={staffCrud.handleClearSearch}
              placeholder="Tìm kiếm nhân viên theo tên, email..."
            />

            <div className={styles.tableContainer}>
              <DataTable
            data={staffCrud.data}
                columns={columns}
            loading={staffCrud.isPageLoading}
            page={staffCrud.page}
            rowsPerPage={staffCrud.rowsPerPage}
            totalCount={staffCrud.totalCount}
            onPageChange={staffCrud.handlePageChange}
            onRowsPerPageChange={staffCrud.handleRowsPerPageChange}
            onView={(staff) => navigate(`/manager/staff/detail/${staff.id}`)}
            onEdit={handleEditStaff}
            onDelete={handleDeleteStaff}
                emptyMessage="Không có nhân viên nào. Hãy tạo tài khoản nhân viên đầu tiên để bắt đầu."
              />
            </div>
      </Box>

      {/* Create Account Dialog */}
      <ManagementFormDialog
        open={openCreateDialog}
        onClose={() => {
          if (!isSubmitting) {
            setOpenCreateDialog(false);
            setIsSubmitting(false);
          }
        }}
        mode="create"
        title="Tài Khoản Nhân Viên"
        icon={GroupsIcon}
        loading={isSubmitting}
        maxWidth="md"
      >
          <StaffAccountForm
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onStaffSubmit={handleStaffSubmit}
            onSuccess={() => {
              setOpenCreateDialog(false);
            }}
          />
      </ManagementFormDialog>

      {/* Update Account Dialog */}
      <ManagementFormDialog
        open={openUpdateDialog && staffCrud.dialogMode === 'edit'}
        onClose={() => {
          setOpenUpdateDialog(false);
          staffCrud.setOpenDialog(false);
        }}
        mode="edit"
        title="Cập Nhật Tài Khoản Nhân Viên"
        icon={GroupsIcon}
        loading={staffCrud.actionLoading}
        maxWidth="sm"
      >
        <Form
          schema={updateUserSchema}
          defaultValues={{
            name: staffCrud.selectedItem?.name || '',
            isActive: staffCrud.selectedItem?.isActive !== undefined ? staffCrud.selectedItem.isActive : true
          }}
          onSubmit={handleStaffUpdateSubmit}
          submitText="Cập nhật Thông Tin"
          loading={staffCrud.actionLoading}
          disabled={staffCrud.actionLoading}
          fields={updateFormFields}
        />
      </ManagementFormDialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={staffCrud.confirmDialog.open}
        onClose={() => staffCrud.setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={staffCrud.confirmDialog.onConfirm}
        title={staffCrud.confirmDialog.title || 'Xác nhận xóa'}
        description={staffCrud.confirmDialog.description || 'Bạn có chắc chắn muốn xóa nhân viên này không?'}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
      />
    </div>
  );
};

export default StaffManagement;

