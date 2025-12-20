import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccessTime as BranchSlotIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  GroupAdd as BulkAddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import DataTable from '../../../components/Common/DataTable';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ManagementFormDialog from '../../../components/Management/FormDialog';
import ContentLoading from '../../../components/Common/ContentLoading';
import Form from '../../../components/Common/Form';
import branchSlotService from '../../../services/branchSlot.service';
import useBranchSlotDependencies from '../../../hooks/useBranchSlotDependencies';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { createBranchSlotColumns } from '../../../definitions/branchSlot/tableColumns';
import { createBranchSlotFormFields } from '../../../definitions/branchSlot/formFields';
import { branchSlotSchema } from '../../../utils/validationSchemas/branchSlotSchemas';
import { toast } from 'react-toastify';
import styles from './BranchSlotManagement.module.css';

/**
 * Week Date Mapping:
 * 0 = Chủ nhật (Sunday)
 * 1 = Thứ 2 (Monday)
 * 2 = Thứ 3 (Tuesday)
 * 3 = Thứ 4 (Wednesday)
 * 4 = Thứ 5 (Thursday)
 * 5 = Thứ 6 (Friday)
 * 6 = Thứ 7 (Saturday)
 */
const WEEK_DAYS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' }
];

const ManagerBranchSlotManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);


  const {
    timeframeOptions,
    slotTypeOptions,
    roomOptions,
    staffOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = useBranchSlotDependencies();

  const {
    data: branchSlots,
    totalCount,
    page,
    rowsPerPage,
    keyword,
    filters,
    error,
    actionLoading,
    isPageLoading,
    loadingText,
    openDialog: dialogOpen,
    setOpenDialog: setDialogOpen,
    dialogMode,
    selectedItem: selectedBranchSlot,
    confirmDialog,
    setConfirmDialog,
    handleCreate: handleCreateBase,
    handleEdit: handleEditBase,
    handleDelete,
    handleFormSubmit: handleFormSubmitBase,
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    handlePageChange,
    handleRowsPerPageChange,
    updateFilter,
    loadData
  } = useBaseCRUD({
    loadFunction: async (params) => {
      return branchSlotService.getMyBranchSlotsPaged({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        status: params.status === '' ? null : params.status,
        weekDate: params.weekDate === '' ? null : params.weekDate,
        timeframeId: params.timeframeId === '' ? null : params.timeframeId,
        slotTypeId: params.slotTypeId === '' ? null : params.slotTypeId,
        date: params.date === '' ? null : params.date
      });
    },
    createFunction: branchSlotService.createMyBranchSlot,
    updateFunction: branchSlotService.updateBranchSlot,
    deleteFunction: branchSlotService.deleteBranchSlot,
    defaultFilters: { status: '', weekDate: '', timeframeId: '', slotTypeId: '', date: '' },
    loadOnMount: true
  });

  const branchSlotColumns = useMemo(() => createBranchSlotColumns(styles), []);

  const timeframeSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn khung giờ' },
      ...timeframeOptions.map((tf) => ({
        value: tf.id,
        label: `${tf.name} (${tf.startTime} - ${tf.endTime})`
      }))
    ],
    [timeframeOptions]
  );

  const slotTypeSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn loại ca giữ trẻ' },
      ...slotTypeOptions.map((st) => ({
        value: st.id,
        label: st.name
      }))
    ],
    [slotTypeOptions]
  );

  const weekDateSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn ngày trong tuần' },
      ...WEEK_DAYS.map((day) => ({
        value: day.value,
        label: day.label
      }))
    ],
    []
  );

  const roomSelectOptions = useMemo(
    () =>
      roomOptions.map((room) => ({
        value: room.id,
        label: room.name
      })),
    [roomOptions]
  );

  const staffSelectOptions = useMemo(
    () =>
      staffOptions.map((staff) => ({
        value: staff.id,
        label: staff.name
      })),
    [staffOptions]
  );


  const branchSlotFormFields = useMemo(
    () =>
      createBranchSlotFormFields({
        actionLoading,
        dependenciesLoading,
        timeframeSelectOptions,
        slotTypeSelectOptions,
        weekDateOptions: weekDateSelectOptions
      }),
    [actionLoading, dependenciesLoading, timeframeSelectOptions, slotTypeSelectOptions, weekDateSelectOptions]
  );

  const branchSlotDefaultValues = useMemo(
    () => ({
      timeframeId: selectedBranchSlot?.timeframeId || selectedBranchSlot?.timeframe?.id || '',
      slotTypeId: selectedBranchSlot?.slotTypeId || selectedBranchSlot?.slotType?.id || '',
      weekDate: selectedBranchSlot?.weekDate ?? '',
      status: selectedBranchSlot?.status || 'Available'
    }),
    [selectedBranchSlot]
  );

  // Fetch dependencies on mount for filters
  useEffect(() => {
    if (timeframeOptions.length === 0 || slotTypeOptions.length === 0) {
      fetchDependencies();
    }
  }, [timeframeOptions.length, slotTypeOptions.length, fetchDependencies]);

  useEffect(() => {
    if (dialogOpen && (dialogMode === 'create' || dialogMode === 'edit')) {
      if (timeframeOptions.length === 0 || slotTypeOptions.length === 0) {
        fetchDependencies();
      }
    }
  }, [dialogOpen, dialogMode, timeframeOptions.length, slotTypeOptions.length, fetchDependencies]);


  // Reload data when navigate back to this page (e.g., from create/update pages)
  useEffect(() => {
    if (location.pathname === '/manager/branch-slots') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      // Force reload if there's a refresh query param (from update/create)
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has('refresh')) {
        // Remove refresh param from URL after reloading
        searchParams.delete('refresh');
        const newSearch = searchParams.toString();
        const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      loadData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleCreate = useCallback(() => {
    // Navigate to create page with stepper
    navigate('/manager/branch-slots/create');
  }, [navigate]);

  const handleEdit = useCallback(
    async (item) => {
      // Navigate to update page with stepper
      navigate(`/manager/branch-slots/update/${item.id}`);
    },
    [navigate]
  );

  const handleFormSubmit = useCallback(
    async (data) => {
      const submitData = {
        timeframeId: data.timeframeId,
        slotTypeId: data.slotTypeId,
        weekDate: Number(data.weekDate),
        status: data.status
      };
      
      // Just create/update branch slot, no staff assignment here
      await handleFormSubmitBase(submitData);
    },
    [handleFormSubmitBase]
  );



  const renderTimeframeFilter = (value, onChange) => (
    <FormControl className={styles.statusFilter} size="small" variant="outlined">
      <InputLabel id="timeframe-filter-label" shrink>
        Khung giờ
      </InputLabel>
      <Select 
        labelId="timeframe-filter-label"
        value={value} 
        onChange={onChange} 
        label="Khung giờ"
        disabled={dependenciesLoading || timeframeSelectOptions.length === 0}
        displayEmpty
        notched
      >
        <MenuItem value="">Tất cả</MenuItem>
        {timeframeSelectOptions.filter(opt => opt.value !== '').map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderSlotTypeFilter = (value, onChange) => (
    <FormControl className={styles.statusFilter} size="small" variant="outlined">
      <InputLabel id="slottype-filter-label" shrink>
        Loại ca giữ trẻ
      </InputLabel>
      <Select 
        labelId="slottype-filter-label"
        value={value} 
        onChange={onChange} 
        label="Loại ca giữ trẻ"
        disabled={dependenciesLoading || slotTypeSelectOptions.length === 0}
        displayEmpty
        notched
      >
        <MenuItem value="">Tất cả</MenuItem>
        {slotTypeSelectOptions.filter(opt => opt.value !== '').map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <div className={styles.container}>
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}

      <ManagementPageHeader
        title="Quản lý Ca Giữ Trẻ"
        createButtonText="Thêm Ca Giữ Trẻ Mới"
        onCreateClick={handleCreate}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/manager/branch-slots/bulk-create')}
          sx={{
            textTransform: 'none',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-family)'
          }}
        >
          Tạo Nhiều Ca Cùng Lúc
        </Button>
      </ManagementPageHeader>

      {/* Hướng dẫn sử dụng */}
      <Box sx={{ mb: 3 }}>
        <Accordion
          defaultExpanded={false}
          sx={{
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            '&:before': { display: 'none' },
            '& .MuiAccordionSummary-root': {
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
            },
            '& .MuiAccordionDetails-root': {
              backgroundColor: 'var(--bg-primary)',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1
              }
            }}
          >
            <InfoIcon color="info" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Hướng dẫn sử dụng trang Quản lý Ca Giữ Trẻ
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ mb: 2 }}>
              Trang này giúp bạn quản lý các ca giữ trẻ của chi nhánh. Dưới đây là hướng dẫn chi tiết để sử dụng:
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Thêm ca giữ trẻ đơn lẻ"
                  secondary="Nhấn nút 'Thêm Ca Giữ Trẻ Mới' để tạo một ca giữ trẻ cụ thể với thông tin chi tiết về khung giờ, loại ca, phòng và nhân viên."
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <BulkAddIcon color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Tạo nhiều ca cùng lúc (khuyến nghị)"
                  secondary="Nhấn nút 'Tạo Nhiều Ca Cùng Lúc' để tạo hàng loạt ca giữ trẻ theo lịch định kỳ. Phù hợp cho việc lên lịch dài hạn."
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SearchIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Tìm kiếm và lọc ca giữ trẻ"
                  secondary="Sử dụng thanh tìm kiếm để tìm theo tên, hoặc dùng các bộ lọc khung giờ, loại ca và ngày để lọc kết quả."
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <EditIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Chỉnh sửa thông tin ca"
                  secondary="Nhấn biểu tượng chỉnh sửa để thay đổi thông tin ca giữ trẻ như khung giờ, phòng hoặc nhân viên phụ trách."
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <DeleteIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Xóa ca giữ trẻ"
                  secondary="Nhấn biểu tượng thùng rác để xóa ca giữ trẻ. Lưu ý: chỉ xóa được ca chưa có lịch hẹn."
                />
              </ListItem>
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Lưu ý:</strong> Để tạo ca giữ trẻ hiệu quả, hãy sử dụng tính năng "Tạo Nhiều Ca Cùng Lúc"
                cho việc lên lịch định kỳ. Bạn có thể chọn nhiều ngày trong tuần và khoảng thời gian dài hạn.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Box>

      {dependenciesError && (
        <Alert severity="warning" className={styles.errorAlert}>
          {dependenciesError}
        </Alert>
      )}

      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={() => {
          handleClearSearch();
          updateFilter('timeframeId', '');
          updateFilter('slotTypeId', '');
          updateFilter('date', '');
        }}
        placeholder="Tìm kiếm theo khung giờ hoặc loại ca giữ trẻ..."
      >
        <TextField
          type="date"
          label="Ngày"
          value={filters.date || ''}
          onChange={(e) => updateFilter('date', e.target.value || '')}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          className={styles.statusFilter}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 'var(--radius-lg)',
            }
          }}
        />
        {renderTimeframeFilter(filters.timeframeId || '', (e) => updateFilter('timeframeId', e.target.value))}
        {renderSlotTypeFilter(filters.slotTypeId || '', (e) => updateFilter('slotTypeId', e.target.value))}
      </ManagementSearchSection>

      {error && (
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      <div className={styles.tableContainer}>
        <DataTable
          data={branchSlots}
          columns={branchSlotColumns}
          loading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={(slot) => navigate(`/manager/branch-slots/detail/${slot.id}`)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Không có ca giữ trẻ nào. Hãy thêm ca giữ trẻ đầu tiên để bắt đầu."
        />
      </div>

      <ManagementFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        title="Ca Giữ Trẻ"
        icon={BranchSlotIcon}
        loading={actionLoading || dependenciesLoading}
        maxWidth="md"
      >
        <Form
          key={`branchSlot-${dialogMode}-${selectedBranchSlot?.id || 'new'}`}
          schema={branchSlotSchema}
          defaultValues={branchSlotDefaultValues}
          onSubmit={handleFormSubmit}
          submitText={dialogMode === 'create' ? 'Tạo Ca Giữ Trẻ' : 'Cập nhật Ca Giữ Trẻ'}
          loading={actionLoading || dependenciesLoading}
          disabled={actionLoading || dependenciesLoading}
          fields={branchSlotFormFields}
        />
      </ManagementFormDialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
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

export default ManagerBranchSlotManagement;

