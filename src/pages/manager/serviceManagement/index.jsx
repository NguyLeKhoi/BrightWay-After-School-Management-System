import React, { useEffect, useMemo, useState } from 'react';
import { Box, Alert, Button, TextField, Switch, FormControlLabel } from '@mui/material';
import DataTable from '../../../components/Common/DataTable';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ContentLoading from '../../../components/Common/ContentLoading';
import serviceService from '../../../services/service.service';
import userService from '../../../services/user.service';
import { useAuth } from '../../../contexts/AuthContext';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import { createServiceColumns } from '../../../definitions/service/tableColumns';
import styles from './ServiceManagement.module.css';
import useContentLoading from '../../../hooks/useContentLoading';

const ManagerServiceManagement = () => {
  const [services, setServices] = useState([]);
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [configPayload, setConfigPayload] = useState({ isActive: true, priceOverride: null, stock: null });
  const { user } = useAuth();

  const columns = useMemo(() => createServiceColumns(), []);

  useEffect(() => {
    const load = async () => {
      try {
        showLoading('Đang tải danh sách dịch vụ...');
        const data = await serviceService.getServicesForCurrentBranch();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || err?.response?.data?.message || 'Không thể tải dịch vụ');
        setServices([]);
      } finally {
        hideLoading();
      }
    };

    load();
  }, [showLoading, hideLoading]);
  
  const openConfigDialog = (service) => {
    setSelectedService(service);
    setConfigPayload({
      isActive: service.isActive !== undefined ? service.isActive : true,
      priceOverride: service.priceOverride !== undefined && service.priceOverride !== null ? service.priceOverride : null,
      stock: service.stock !== undefined && service.stock !== null ? service.stock : null
    });
    setConfigDialogOpen(true);
  };

  const closeConfigDialog = () => {
    setConfigDialogOpen(false);
    setSelectedService(null);
  };

  const handleConfigSubmit = async () => {
    if (!selectedService) return;
    try {
      showLoading('Đang cập nhật...');
      // Try to derive branchId from current auth user; fallback to fetching current user details
      let branchId = user?.branchId || user?.branch?.id || null;
      if (!branchId) {
        try {
          const fresh = await userService.getCurrentUser();
          branchId = fresh?.branchId || fresh?.branch?.id || null;
        } catch (e) {
          // ignore - we'll still send null and let backend decide
        }
      }

      const payload = {
        branchId: branchId,
        serviceId: selectedService.serviceId || selectedService.id || selectedService.Id || null,
        isActive: !!configPayload.isActive,
        priceOverride: configPayload.priceOverride !== null && configPayload.priceOverride !== '' ? Number(configPayload.priceOverride) : null,
        stock: configPayload.stock !== null && configPayload.stock !== '' ? Number(configPayload.stock) : null
      };
      await serviceService.updateBranchServiceConfig(payload);
      // Refresh list
      const data = await serviceService.getServicesForCurrentBranch();
      setServices(Array.isArray(data) ? data : []);
      closeConfigDialog();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Không thể cập nhật cấu hình dịch vụ');
    } finally {
      hideLoading();
    }
  };
  // Pagination helpers
  const handlePageChange = (e, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const paginated = services.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className={styles.container}>
      <ContentLoading isLoading={isLoading} text={loadingText} />

      <ManagementPageHeader title="Dịch Vụ (Xem)" />

      {error && <Alert severity="error">{error}</Alert>}

      <div className={styles.tableContainer}>
        <DataTable
          data={paginated}
          columns={columns}
          loading={isLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={services.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          // Add edit handler to allow updating branch-level config
          onEdit={openConfigDialog}
          emptyMessage="Không có dịch vụ cho chi nhánh hiện tại"
        />
      </div>

      {/* Config Dialog for branch-level update (reused ManagementFormDialog) */}
      <ManagementFormDialog
        open={configDialogOpen}
        onClose={closeConfigDialog}
        mode="edit"
        title="cấu hình dịch vụ"
        rawTitle="Cập nhật cấu hình dịch vụ"
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!configPayload.isActive}
                onChange={(e) => setConfigPayload(prev => ({ ...prev, isActive: e.target.checked }))}
              />
            }
            label="Kích hoạt dịch vụ cho chi nhánh"
          />
          <TextField
            label="Ghi đè giá (VND)"
            type="number"
            value={configPayload.priceOverride ?? ''}
            onChange={(e) => setConfigPayload(prev => ({ ...prev, priceOverride: e.target.value }))}
            helperText="Để trống nếu không muốn ghi đè giá"
            fullWidth
          />
          <TextField
            label="Tồn kho"
            type="number"
            value={configPayload.stock ?? ''}
            onChange={(e) => setConfigPayload(prev => ({ ...prev, stock: e.target.value }))}
            helperText="Tùy chọn: cập nhật tồn kho cho chi nhánh"
            fullWidth
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button onClick={closeConfigDialog}>Hủy</Button>
            <Button variant="contained" onClick={handleConfigSubmit}>Cập nhật</Button>
          </Box>
        </Box>
      </ManagementFormDialog>
    </div>
  );
};

export default ManagerServiceManagement;
