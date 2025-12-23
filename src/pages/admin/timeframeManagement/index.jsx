import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Schedule as TimeframeIcon } from '@mui/icons-material';
import DataTable from '../../../components/Common/DataTable';
import Form from '../../../components/Common/Form';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import timeframeService from '../../../services/timeframe.service';
import { useApp } from '../../../contexts/AppContext';
import styles from './TimeframeManagement.module.css';

const TimeframeManagement = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Tên khung giờ',
      render: (value) => value || 'N/A',
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (value) => value || 'Không có mô tả',
    },
    {
      key: 'startTime',
      header: 'Giờ bắt đầu',
      render: (value) => {
        return value ? value.substring(0, 5) : 'N/A';
      },
    },
    {
      key: 'endTime',
      header: 'Giờ kết thúc',
      render: (value) => {
        return value ? value.substring(0, 5) : 'N/A';
      },
    },
  ], []);

  const timeframeFormFields = useMemo(() => [
    {
      name: 'name',
      label: 'Tên khung giờ',
      type: 'text',
      required: true,
      placeholder: 'Nhập tên khung giờ',
    },
    {
      name: 'description',
      label: 'Mô tả',
      type: 'textarea',
      required: false,
      placeholder: 'Nhập mô tả',
    },
    {
      name: 'startTime',
      label: 'Giờ bắt đầu',
      type: 'time',
      required: true,
    },
    {
      name: 'endTime',
      label: 'Giờ kết thúc',
      type: 'time',
      required: true,
    },
  ], []);

  // CRUD operations
  const loadTimeframesFunction = useCallback(async (params) => {
    try {
      const response = await timeframeService.getTimeframesPaged({
        pageIndex: params.pageIndex || 1,
        pageSize: params.pageSize || 10,
        searchTerm: params.Keyword || params.searchTerm || '',
      });

      // Normalize response structure
      if (Array.isArray(response)) {
        return {
          items: response,
          totalCount: response.length,
        };
      }

      // Check for items property
      if (response?.items) {
        return {
          items: Array.isArray(response.items) ? response.items : [],
          totalCount: response.totalCount || response.items.length || 0,
        };
      }

      // Check for Items property (case variation)
      if (response?.Items) {
        return {
          items: Array.isArray(response.Items) ? response.Items : [],
          totalCount: response.TotalCount || response.Items.length || 0,
        };
      }

      return {
        items: [],
        totalCount: 0,
      };
    } catch (error) {
      throw error;
    }
  }, []);

  const {
    data: timeframes,
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
    selectedItem: selectedTimeframe,
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
    handleRowsPerPageChange,
  } = useBaseCRUD({
    loadFunction: loadTimeframesFunction,
    createFunction: timeframeService.createTimeframe,
    updateFunction: timeframeService.updateTimeframe,
    deleteFunction: timeframeService.deleteTimeframe,
    minLoadingDuration: 300,
    loadOnMount: true,
  });

  // Handle search
  const handleSearchSubmit = useCallback((searchValue) => {
    handleKeywordSearch(searchValue);
  }, [handleKeywordSearch]);

  // Handle create button click
  const handleCreateNew = useCallback(() => {
    handleCreate();
  }, [handleCreate]);

  // Handle form submit
  const handleFormSubmitWithValidation = useCallback(async (formData) => {
    try {
      if (selectedTimeframe?.id) {
        // Update mode
        await timeframeService.updateTimeframe(selectedTimeframe.id, formData);
      } else {
        // Create mode
        await timeframeService.createTimeframe(formData);
      }
      setOpenDialog(false);
      loadData(false);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      showGlobalError(message);
    }
  }, [selectedTimeframe, setOpenDialog, loadData, showGlobalError]);

  return (
    <>
      <ContentLoading isLoading={isPageLoading} text={loadingText} />

      <div className={styles.container}>
        {/* Header */}
        <ManagementPageHeader
          title="Quản lý khung giờ"
          description="Quản lý các khung giờ hoạt động của trung tâm"
          icon={TimeframeIcon}
          onCreateNew={handleCreateNew}
        />

        {/* Search Section */}
        <ManagementSearchSection
          onSearch={handleSearchSubmit}
          placeholder="Tìm kiếm theo tên khung giờ..."
          searchValue={keyword}
          onClearSearch={handleClearSearch}
        />

        {/* Error Alert */}
        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={timeframes}
          loading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Không có khung giờ nào. Hãy thêm khung giờ đầu tiên để bắt đầu."
        />

        {/* Form Dialog */}
        <ManagementFormDialog
          open={openDialog}
          title={selectedTimeframe ? 'Cập nhật khung giờ' : 'Thêm khung giờ mới'}
          onClose={() => setOpenDialog(false)}
        >
          <Form
            fields={timeframeFormFields}
            initialValues={
              selectedTimeframe || {
                name: '',
                description: '',
                startTime: '',
                endTime: '',
              }
            }
            onSubmit={handleFormSubmitWithValidation}
            onCancel={() => setOpenDialog(false)}
            submitButtonText={selectedTimeframe ? 'Cập nhật' : 'Thêm mới'}
          />
        </ManagementFormDialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.description}
        />
      </div>
    </>
  );
};

export default TimeframeManagement;
