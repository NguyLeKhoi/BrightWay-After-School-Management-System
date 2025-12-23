import React, { useEffect, useMemo, useState } from 'react';
import { Box, Alert } from '@mui/material';
import DataTable from '../../../components/Common/DataTable';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ContentLoading from '../../../components/Common/ContentLoading';
import serviceService from '../../../services/service.service';
import { createServiceColumns } from '../../../definitions/service/tableColumns';
import styles from './ServiceManagement.module.css';
import useContentLoading from '../../../hooks/useContentLoading';

const ManagerServiceManagement = () => {
  const [services, setServices] = useState([]);
  const { isLoading, loadingText, showLoading, hideLoading } = useContentLoading();
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
          // No edit/delete/assign handlers - read-only for manager
          emptyMessage="Không có dịch vụ cho chi nhánh hiện tại"
        />
      </div>
    </div>
  );
};

export default ManagerServiceManagement;
