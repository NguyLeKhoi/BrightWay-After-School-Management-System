import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, Checkbox, ListItemText, CircularProgress, Box } from '@mui/material';
import { LocalOffer as ServiceIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import serviceService from '../../../services/service.service';
import { createServiceColumns } from '../../../definitions/service/tableColumns';
import { createServiceFormFields } from '../../../definitions/service/formFields';
import { serviceSchema } from '../../../utils/validationSchemas/serviceSchemas';
import styles from './ServiceManagement.module.css';

const ServiceManagement = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [dialogMode, setDialogMode] = useState('create');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    service: null,
    onConfirm: null
  });

  const columns = useMemo(() => createServiceColumns(), []);
  const serviceFormFields = useMemo(() => createServiceFormFields(actionLoading), [actionLoading]);

  // Load services
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getAllServices();
      setServices(Array.isArray(data) ? data : []);
      setFilteredServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on keyword
  useEffect(() => {
    if (!keyword.trim()) {
      setFilteredServices(services);
      setPage(0);
      return;
    }

    const filtered = services.filter((service) => {
      const searchTerm = keyword.toLowerCase();
      return (
        service.name?.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm) ||
        service.serviceType?.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredServices(filtered);
    setPage(0);
  }, [keyword, services]);

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleKeywordSearch = () => {
    // Filter is handled automatically by useEffect
  };

  const handleClearSearch = () => {
    setKeyword('');
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setDialogMode('create');
    setOpenDialog(true);
  };

  const handleView = (service) => {
    navigate(`/admin/services/detail/${service.id}`);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleDelete = (service) => {
    setConfirmDialog({
      open: true,
      service: service,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await serviceService.deleteService(service.id);
          toast.success('Xóa dịch vụ thành công!', {
            position: 'top-right',
            autoClose: 3000
          });
          setConfirmDialog({ open: false, service: null, onConfirm: null });
          await loadServices();
        } catch (err) {
          const errorMessage = err?.message || err?.response?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ';
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 5000
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Assign / Unassign branches handlers (from list)
  const handleOpenAssignDialog = async (service) => {
    setSelectedService(service);
    // Prefill selectedBranches with branches already assigned to the service
    const assigned = (service?.branches || []).map(b => b.id);
    setSelectedBranches(assigned);
    setAssignDialogOpen(true);
  };

  const handleOpenUnassignDialog = async (service) => {
    // Load latest service data, but do NOT pre-select branches.
    try {
      setLoadingBranches(true);
      const svc = await serviceService.getServiceById(service.id);
      setSelectedService(svc);
      setSelectedBranches([]);
    } catch (err) {
      // fallback to provided service if fetch fails
      setSelectedService(service);
      setSelectedBranches([]);
    } finally {
      setLoadingBranches(false);
      setUnassignDialogOpen(true);
    }
  };

  const loadAllBranches = async () => {
    try {
      setLoadingBranches(true);
      const branches = await (await import('../../../services/branch.service')).default.getAllBranches();
      setAllBranches(branches || []);
    } catch (err) {
      setAllBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load branches when assign/unassign dialog opens
  useEffect(() => {
    if (assignDialogOpen || unassignDialogOpen) {
      loadAllBranches();
    }
  }, [assignDialogOpen, unassignDialogOpen]);

  const handleAssignBranches = async () => {
    if (!selectedService || selectedBranches.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chi nhánh');
      return;
    }

    try {
      setActionLoading(true);
      await serviceService.assignServiceToBranches(selectedService.id, selectedBranches);
      toast.success(`Đã gán dịch vụ vào ${selectedBranches.length} chi nhánh thành công!`);
      setAssignDialogOpen(false);
      setSelectedService(null);
      await loadServices();
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || 'Không thể gán dịch vụ';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignBranches = async () => {
    if (!selectedService || selectedBranches.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chi nhánh');
      return;
    }

    try {
      setActionLoading(true);
      await serviceService.unassignServiceFromBranches(selectedService.id, selectedBranches);
      toast.success(`Đã hủy gán dịch vụ khỏi ${selectedBranches.length} chi nhánh thành công!`);
      setUnassignDialogOpen(false);
      setSelectedService(null);
      await loadServices();
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || 'Không thể hủy gán dịch vụ';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setActionLoading(true);
    setError(null);
    
    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      if (dialogMode === 'edit' && selectedService) {
        formDataToSend.append('Id', selectedService.id);
      }
      
      formDataToSend.append('Name', formData.name || '');
      formDataToSend.append('Description', formData.description || '');
      formDataToSend.append('Price', formData.price ? String(formData.price) : '0');
      formDataToSend.append('Stock', formData.stock !== undefined ? String(formData.stock) : '0');
      formDataToSend.append('Status', formData.status !== undefined ? String(formData.status) : 'true');
      formDataToSend.append('ServiceType', 'AddOn'); // Fixed value as per user requirement
      
      // Image file (optional) - only append if it's a new file
      if (formData.imageFile && formData.imageFile instanceof File) {
        formDataToSend.append('imageFile', formData.imageFile);
      }
      
      // SlotTypeIds - send empty (don't append)
      
      if (dialogMode === 'edit') {
        await serviceService.updateService(formDataToSend);
        toast.success('Cập nhật dịch vụ thành công!', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        await serviceService.createService(formDataToSend);
        toast.success('Tạo dịch vụ thành công!', {
          position: 'top-right',
          autoClose: 3000
        });
      }
      
      setOpenDialog(false);
      setSelectedService(null);
      await loadServices();
    } catch (err) {
      const errorMessage = err?.message || err?.response?.data?.message || `Có lỗi xảy ra khi ${dialogMode === 'edit' ? 'cập nhật' : 'tạo'} dịch vụ`;
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Paginate data
  const paginatedServices = filteredServices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className={styles.container}>
      {loading && <ContentLoading isLoading={loading} text="Đang tải danh sách dịch vụ..." />}
      
      {/* Header */}
      <ManagementPageHeader
        title="Quản lý Dịch Vụ"
        createButtonText="Thêm Dịch Vụ"
        onCreateClick={handleCreate}
      />

      {/* Search Section */}
      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={handleClearSearch}
        placeholder="Tìm kiếm theo tên, mô tả hoặc loại dịch vụ..."
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className={styles.errorAlert} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <DataTable
          data={paginatedServices}
          columns={columns}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredServices.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignBranches={handleOpenAssignDialog}
          onUnassignBranches={handleOpenUnassignDialog}
          emptyMessage="Không có dịch vụ nào. Hãy thêm dịch vụ đầu tiên để bắt đầu."
        />
      </div>

      {/* Form Dialog */}
      <ManagementFormDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedService(null);
        }}
        mode={dialogMode}
        title="Dịch Vụ"
        icon={ServiceIcon}
        loading={actionLoading}
        maxWidth="md"
      >
        <Form
          schema={serviceSchema}
          defaultValues={{
            name: selectedService?.name || '',
            description: selectedService?.description || '',
            price: selectedService?.price || 0,
            stock: selectedService?.stock ?? 0,
            status: selectedService?.status !== undefined ? selectedService.status : true,
            imageFile: dialogMode === 'edit' && selectedService?.image ? selectedService.image : null
          }}
          onSubmit={handleFormSubmit}
          submitText={dialogMode === 'edit' ? 'Cập nhật Dịch Vụ' : 'Tạo Dịch Vụ'}
          loading={actionLoading}
          disabled={actionLoading}
          fields={serviceFormFields.map(field => {
            // For edit mode, pass current image URL to ImageUpload component
            if (field.name === 'imageFile' && dialogMode === 'edit' && selectedService?.image) {
              return {
                ...field,
                currentImageUrl: selectedService.image
              };
            }
            return field;
          })}
        />
      </ManagementFormDialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, service: null, onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title="Xác nhận xóa dịch vụ"
        description={`Bạn có chắc chắn muốn xóa dịch vụ "${confirmDialog.service?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
      />

      {/* Assign Branches Dialog (shared ManagementFormDialog) */}
      <ManagementFormDialog
        open={assignDialogOpen}
        onClose={() => { setAssignDialogOpen(false); setSelectedService(null); }}
        title="Gán chi nhánh"
        rawTitle={selectedService ? `Gán chi nhánh cho: ${selectedService.name}` : 'Gán chi nhánh'}
        icon={ServiceIcon}
        maxWidth="sm"
      >
        {loadingBranches ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Autocomplete
            multiple
            options={allBranches}
            getOptionLabel={(option) => option.branchName || option.name || option.displayName || ''}
            value={allBranches.filter(b => selectedBranches.includes(b.id))}
            onChange={(e, value) => setSelectedBranches(value.map(v => v.id))}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  style={{ marginRight: 8 }}
                  checked={selectedBranches.includes(option.id)}
                />
                <ListItemText primary={option.branchName || option.name || option.displayName} />
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Chọn chi nhánh" placeholder="Tìm chi nhánh" />
            )}
          />
        )}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button onClick={() => { setAssignDialogOpen(false); setSelectedService(null); }}>Hủy</Button>
          <Button variant="contained" onClick={handleAssignBranches} disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Gán chi nhánh'}
          </Button>
        </Box>
      </ManagementFormDialog>

      {/* Unassign Branches Dialog (shared ManagementFormDialog) */}
      <ManagementFormDialog
        open={unassignDialogOpen}
        onClose={() => { setUnassignDialogOpen(false); setSelectedService(null); }}
        title="Hủy gán chi nhánh"
        rawTitle={selectedService ? `Hủy gán chi nhánh cho: ${selectedService.name}` : 'Hủy gán chi nhánh'}
        icon={ServiceIcon}
        maxWidth="sm"
      >
        {loadingBranches ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Autocomplete
            multiple
            // Show only branches that are currently assigned to the service
            options={allBranches.filter(b => (selectedService?.branches || []).some(sb => sb.id === b.id))}
            getOptionLabel={(option) => option.branchName || option.name || option.displayName || ''}
            value={allBranches.filter(b => selectedBranches.includes(b.id))}
            onChange={(e, value) => setSelectedBranches(value.map(v => v.id))}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  style={{ marginRight: 8 }}
                  checked={selectedBranches.includes(option.id)}
                />
                <ListItemText primary={option.branchName || option.name || option.displayName} />
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Chọn chi nhánh" placeholder="Tìm chi nhánh" />
            )}
          />
        )}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button onClick={() => { setUnassignDialogOpen(false); setSelectedService(null); }}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleUnassignBranches} disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Hủy gán'}
          </Button>
        </Box>
      </ManagementFormDialog>
    </div>
  );
};

export default ServiceManagement;

