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
import {
  Button,
  CircularProgress,
  Box,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider,
  Typography,
  Stack
} from '@mui/material';
import { Inventory as PackageIcon } from '@mui/icons-material';
import packageService from '../../../services/package.service';
import styles from './SlotTypeManagement.module.css';

const SlotTypeManagement = () => {
  const navigate = useNavigate();
  const { showGlobalError, addNotification } = useApp();
  const { user: authUser } = useAuth();
  const [managerBranchId, setManagerBranchId] = useState(null);

  const columns = useMemo(() => createSlotTypeColumns(), []);
  const slotTypeFormFields = useMemo(() => createSlotTypeFormFields(false), []);

  // Load manager's branch ID on mount
  useEffect(() => {
    const fetchManagerBranch = async () => {
      try {
        const branchIdFromAuth =
          authUser?.branchId ||
          authUser?.managerProfile?.branchId ||
          authUser?.managerBranchId;

        if (branchIdFromAuth) {
          setManagerBranchId(branchIdFromAuth);
          return;
        }

        const currentUser = await userService.getCurrentUser();
        const managerBranchIdFromApi =
          currentUser?.managerProfile?.branchId ||
          currentUser?.branchId ||
          currentUser?.managerBranchId ||
          null;

        if (managerBranchIdFromApi) {
          setManagerBranchId(managerBranchIdFromApi);
        }
      } catch (err) {
        showGlobalError('Không thể xác định chi nhánh. Vui lòng đăng nhập lại.');
      }
    };

    fetchManagerBranch();
  }, [authUser, showGlobalError]);

  const loadSlotTypesFunction = useCallback(async (params) => {
    if (!managerBranchId) {
      return { items: [], totalCount: 0, pageIndex: 1, pageSize: 10 };
    }

    return await slotTypeService.getSlotTypesPaged({
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 10,
      searchTerm: params.Keyword || params.searchTerm || '',
      branchId: managerBranchId
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

  // State cho dialog gán gói
  const [assignPackagesDialog, setAssignPackagesDialog] = useState({ open: false, slotType: null });
  const [packageOptions, setPackageOptions] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');

  const handleViewDetail = (slotType) => {
    navigate(`/manager/slot-types/detail/${slotType.id}`);
  };

  // Xử lý khi click "Gán gói"
  const handleAssignPackages = async (slotType) => {
    setAssignPackagesDialog({ open: true, slotType });
    setLoadingPackages(true);
    try {
      // Lấy danh sách gói của chi nhánh manager
      const res = await packageService.getMyBranchPackagesPaged({ pageIndex: 1, pageSize: 100, branchId: managerBranchId });
      setPackageOptions(res.items || []);
      // Nếu slotType đã có assignedPackages thì set sẵn
      setSelectedPackageIds(Array.isArray(slotType.assignedPackages) ? slotType.assignedPackages.map(pkg => pkg.id) : []);
    } catch (err) {
      setPackageOptions([]);
    } finally {
      setLoadingPackages(false);
    }
  };
  // Đóng dialog gán gói
  const handleCloseAssignPackages = () => {
    setAssignPackagesDialog({ open: false, slotType: null });
    setPackageOptions([]);
    setSelectedPackageIds([]);
    setPackageSearch('');
  };

  // Toggle package selection
  const handleTogglePackage = (pkgId) => {
    setSelectedPackageIds((prev) => {
      if (prev.includes(pkgId)) return prev.filter((id) => id !== pkgId);
      return [...prev, pkgId];
    });
  };

  const handlePackageSearchChange = (e) => setPackageSearch(e.target.value || '');

  // Lưu gán gói cho slotType
  const handleSaveAssignments = async () => {
    if (!assignPackagesDialog.slotType) return;
    setSavingAssignments(true);
    try {
      const slotTypeId = assignPackagesDialog.slotType.id;
      // For each package in the current options, fetch existing slotType ids and update
      for (const pkg of packageOptions) {
        try {
          const pkgDetail = await packageService.getPackageById(pkg.id);
          let existing = [];
          if (Array.isArray(pkgDetail.slotTypeIds)) existing = pkgDetail.slotTypeIds;
          else if (Array.isArray(pkgDetail.slotTypes)) existing = pkgDetail.slotTypes.map(s => s.id);

          const shouldInclude = selectedPackageIds.includes(pkg.id);
          const newSlotTypeIds = shouldInclude
            ? Array.from(new Set([...(existing || []), slotTypeId]))
            : (existing || []).filter(id => id !== slotTypeId);

          const noChange = (existing || []).length === newSlotTypeIds.length && (existing || []).every(id => newSlotTypeIds.includes(id));
          if (!noChange) {
            await packageService.assignSlotTypesToPackage(pkg.id, { slotTypeIds: newSlotTypeIds });
          }
        } catch (pkgErr) {
          // If one package fails, throw to show error and stop further calls
          throw pkgErr;
        }
      }

      addNotification({ message: 'Gán gói thành công', severity: 'success' });
      handleCloseAssignPackages();
      loadData(false);
    } catch (err) {
      console.error(err);
      showGlobalError(err?.message || 'Lỗi khi gán gói');
    } finally {
      setSavingAssignments(false);
    }
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
          onAssignPackages={handleAssignPackages}
          emptyMessage="Không có loại ca nào. Hãy thêm loại ca đầu tiên để bắt đầu."
        />
        {/* Popup dialog chọn gói (sử dụng ManagementFormDialog để đồng bộ UI) */}
        <ManagementFormDialog
          open={assignPackagesDialog.open}
          onClose={handleCloseAssignPackages}
          rawTitle="Gán gói cho loại ca"
          icon={PackageIcon}
          loading={loadingPackages}
          maxWidth="sm"
        >
          {loadingPackages ? (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <TextField
                placeholder="Tìm kiếm gói..."
                fullWidth
                size="small"
                value={packageSearch}
                onChange={handlePackageSearchChange}
                sx={{ mb: 2 }}
              />

              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {packageOptions && packageOptions.filter((pkg) => {
                  const q = packageSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (pkg.name || '').toLowerCase().includes(q) || (pkg.description || '').toLowerCase().includes(q);
                }).map((pkg) => {
                  const selected = selectedPackageIds.includes(pkg.id);
                  return (
                    <React.Fragment key={pkg.id}>
                      <ListItem
                        secondaryAction={(
                          <ListItemSecondaryAction>
                            <Checkbox
                              edge="end"
                              onChange={() => handleTogglePackage(pkg.id)}
                              checked={selected}
                              color="primary"
                              inputProps={{ 'aria-label': `select-${pkg.id}` }}
                            />
                          </ListItemSecondaryAction>
                        )}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main' }}>
                            <PackageIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={(
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {pkg.name}
                              </Typography>
                              {pkg.isActive === false ? (
                                <Chip label="Đã tắt" size="small" color="default" />
                              ) : null}
                            </Stack>
                          )}
                          secondary={(
                            pkg.price ? (
                              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                                {typeof pkg.price === 'number' ? pkg.price.toLocaleString() + ' đ' : pkg.price}
                              </Typography>
                            ) : null
                          )}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  );
                })}

                {packageOptions.length === 0 && (
                  <Box textAlign="center" p={2}>
                    <Typography variant="body2" color="text.secondary">Không tìm thấy gói nào trong chi nhánh.</Typography>
                  </Box>
                )}
              </List>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={handleCloseAssignPackages} color="inherit">Hủy</Button>
                <Button
                  onClick={handleSaveAssignments}
                  variant="contained"
                  disabled={loadingPackages || savingAssignments}
                  sx={{
                    background: 'var(--color-secondary)',
                    '&:hover': { background: 'var(--color-secondary-dark)' },
                    color: '#fff'
                  }}
                >
                  {savingAssignments ? <CircularProgress size={18} color="inherit" /> : 'Lưu'}
                </Button>
              </Box>
            </Box>
          )}
        </ManagementFormDialog>
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


