import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  TextField
} from '@mui/material';
import {
  ShoppingCart as PackageIcon,
  DashboardCustomize as TemplateTabIcon
} from '@mui/icons-material';
import DataTable from '../../../components/Common/DataTable';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ContentLoading from '../../../components/Common/ContentLoading';
import Form from '../../../components/Common/Form';
import packageService from '../../../services/package.service';
import packageTemplateService from '../../../services/packageTemplate.service';
import authService from '../../../services/auth.service';
import usePackageDependencies from '../../../hooks/usePackageDependencies';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import useFacilityBranchData from '../../../hooks/useFacilityBranchData';
import { createTemplateColumns, createPackageColumns } from '../../../definitions/package/tableColumns';
import { createTemplateFormFields, createPackageFormFields } from '../../../definitions/package/formFields';
import styles from './PackageManagement.module.css';
import { useNavigate, useLocation } from 'react-router-dom';

const extractBenefitIds = (source) => {
  if (!source) return [];
  if (Array.isArray(source.benefits)) {
    return source.benefits
      .map((benefit) => benefit?.id || benefit?.benefitId)
      .filter(Boolean);
  }
  if (Array.isArray(source.benefitIds)) {
    return source.benefitIds.filter(Boolean);
  }
  return [];
};

const PackageManagement = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const isInitialMount = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    benefits,
    benefitOptions,
    studentLevelOptions,
    branchOptions,
    loading: dependenciesLoading,
    error: dependenciesError,
    fetchDependencies
  } = usePackageDependencies();

  const {
    data: templates,
    totalCount: templateTotalCount,
    page: templatePage,
    rowsPerPage: templateRowsPerPage,
    keyword: templateSearchTerm,
    filters: templateFilters,
    error: templateError,
    actionLoading: templateActionLoading,
    isPageLoading: templateIsPageLoading,
    loadingText: templateLoadingText,
    selectedItem: selectedTemplate,
    confirmDialog: templateConfirmDialog,
    setConfirmDialog: setTemplateConfirmDialog,
    handleDelete: templateHandleDelete,
    handleFormSubmit: templateHandleFormSubmitBase,
    handleKeywordSearch: templateHandleKeywordSearch,
    handleKeywordChange: templateHandleKeywordChange,
    handleClearSearch: templateHandleClearSearch,
    handlePageChange: templateHandlePageChange,
    handleRowsPerPageChange: templateHandleRowsPerPageChange,
    updateFilter: templateUpdateFilter,
    loadData: templateLoadData
  } = useBaseCRUD({
    loadFunction: async (params) => {
      return packageTemplateService.getTemplatesPaged({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        searchTerm: params.searchTerm || params.Keyword || ''
      });
    },
    createFunction: packageTemplateService.createTemplate,
    updateFunction: packageTemplateService.updateTemplate,
    deleteFunction: packageTemplateService.deleteTemplate,
    defaultFilters: {},
    loadOnMount: true
  });

  const {
    data: packages,
    totalCount: packageTotalCount,
    page: packagePage,
    rowsPerPage: packageRowsPerPage,
    keyword: packageSearchTerm,
    filters: packageFilters,
    error: packageError,
    actionLoading: packageActionLoading,
    isPageLoading: packageIsPageLoading,
    loadingText: packageLoadingText,
    openDialog: packageDialogOpen,
    setOpenDialog: setPackageDialogOpen,
    dialogMode: packageDialogMode,
    selectedItem: selectedPackage,
    confirmDialog: packageConfirmDialog,
    setConfirmDialog: setPackageConfirmDialog,
    handleCreate: packageHandleCreateBase,
    handleEdit: packageHandleEditBase,
    handleDelete: packageHandleDelete,
    handleFormSubmit: packageHandleFormSubmitBase,
    handleKeywordSearch: packageHandleKeywordSearch,
    handleKeywordChange: packageHandleKeywordChange,
    handleClearSearch: packageHandleClearSearch,
    handlePageChange: packageHandlePageChange,
    handleRowsPerPageChange: packageHandleRowsPerPageChange,
    updateFilter: packageUpdateFilter,
    loadData: packageLoadData
  } = useBaseCRUD({
    loadFunction: async (params) => {
      return packageService.getPackagesPaged({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        searchTerm: params.searchTerm || params.Keyword || '',
        status: params.status === '' ? null : params.status === 'true',
        branchId: params.branchId || '',
        date: params.date || null
      });
    },
    createFunction: packageService.createPackage,
    updateFunction: packageService.updatePackage,
    deleteFunction: packageService.deletePackage,
    defaultFilters: { status: '', branchId: '', date: '' },
    loadOnMount: true
  });

  const [templateOptions, setTemplateOptions] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [branchFilterLoading, setBranchFilterLoading] = useState(false);

  const benefitSelectOptions = useMemo(() => {
    if (!benefitOptions?.length) {
      return [];
    }
    return benefitOptions.map((benefit) => ({
      value: benefit.id,
      label: benefit.name
    }));
  }, [benefitOptions]);

  const { branches, fetchBranches } = useFacilityBranchData();

  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      setBranchFilterLoading(true);
      try {
        await fetchBranches();
      } finally {
        if (isMounted) {
          setBranchFilterLoading(false);
        }
      }
    };

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [fetchBranches]);

  const branchFilterOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả chi nhánh' },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.branchName
      }))
    ],
    [branches]
  );

  const fetchTemplateOptions = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const templatesData = await packageTemplateService.getAllTemplates();
      setTemplateOptions(templatesData || []);
    } catch {
      setTemplateOptions([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const templateColumns = useMemo(() => createTemplateColumns(styles), []);
  const packageColumns = useMemo(() => createPackageColumns(styles), []);

  const handleCreateTemplate = () => navigate('/admin/packages/templates/create');
  const handleEditTemplate = (item) => navigate(`/admin/packages/templates/update/${item.id}`);
  const handleViewTemplate = (item) => navigate(`/admin/packages/templates/detail/${item.id}`);

  const handleCreatePackage = () => navigate('/admin/packages/create');
  const handleEditPackage = (item) => navigate(`/admin/packages/update/${item.id}`);

  // Reload data when navigate back to this page (e.g., from create/update pages)
  useEffect(() => {
    if (location.pathname === '/admin/packages') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      // Reload current tab data using loadData from each tab's useBaseCRUD
      if (activeTab === 'templates') {
        templateLoadData(false);
      } else if (activeTab === 'packages') {
        packageLoadData(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activeTab]);

  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  // Template and Package form handlers are defined in CreateTemplate/UpdateTemplate/CreatePackage/UpdatePackage components

  // Template form fields and default values are defined in CreateTemplate/UpdateTemplate components

  const branchSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn chi nhánh' },
      ...branchOptions.map((branch) => ({
        value: branch.id,
        label: branch.name
      }))
    ],
    [branchOptions]
  );

  const studentLevelSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn cấp độ trẻ em' },
      ...studentLevelOptions.map((level) => ({
        value: level.id,
        label: level.name
      }))
    ],
    [studentLevelOptions]
  );

  const templateSelectOptions = useMemo(() => {
    if (loadingTemplates) {
      return [{ value: '', label: 'Đang tải mẫu gói...' }];
    }

    const baseOptions = templateOptions.map((template) => ({
      value: template.id,
      label: template.name
    }));

    const placeholderLabel = baseOptions.length
      ? 'Chọn mẫu gói'
      : 'Không có mẫu gói khả dụng';

    const options = [{ value: '', label: placeholderLabel }, ...baseOptions];

    const currentTemplateId =
      selectedPackage?.packageTemplateId || selectedPackage?.packageTemplate?.id;

    if (
      currentTemplateId &&
      !options.some((option) => option.value === currentTemplateId)
    ) {
      options.push({
        value: currentTemplateId,
        label:
          selectedPackage?.packageTemplate?.name ||
          selectedPackage?.packageTemplateName ||
          'Mẫu gói hiện tại'
      });
    }

    return options;
  }, [loadingTemplates, templateOptions, selectedPackage]);

  // Package form fields are defined in CreatePackage/UpdatePackage components
  // const packageFormFields = useMemo(
  //   () =>
  //     createPackageFormFields({
  //       packageActionLoading,
  //       dependenciesLoading,
  //       loadingTemplates,
  //       templateSelectOptions,
  //       branchSelectOptions,
  //       studentLevelSelectOptions,
  //       benefitSelectOptions
  //     }),
  //   [
  //     packageActionLoading,
  //     dependenciesLoading,
  //     loadingTemplates,
  //     templateSelectOptions,
  //     branchSelectOptions,
  //     studentLevelSelectOptions,
  //     benefitSelectOptions
  //   ]
  // );


  // Package default values are defined in CreatePackage/UpdatePackage components

  const isTemplateTab = activeTab === 'templates';
  const activeLoading = isTemplateTab ? templateIsPageLoading : packageIsPageLoading;
  const activeLoadingText = isTemplateTab ? templateLoadingText : packageLoadingText;

  const renderStatusFilter = (value, onChange) => (
    <FormControl className={styles.statusFilter}>
      <InputLabel>Trạng thái</InputLabel>
      <Select value={value} onChange={onChange} label="Trạng thái">
        <MenuItem value="">Tất cả</MenuItem>
        <MenuItem value="true">Hoạt động</MenuItem>
        <MenuItem value="false">Không hoạt động</MenuItem>
      </Select>
    </FormControl>
  );

  const renderBranchFilter = (value, onChange) => (
    <FormControl className={styles.statusFilter} disabled={branchFilterLoading}>
      <InputLabel>Chi nhánh</InputLabel>
      <Select value={value} onChange={onChange} label="Chi nhánh">
        {branchFilterOptions.map((option) => (
          <MenuItem key={option.value || 'all-branches'} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderDateFilter = (value, onChange) => (
    <TextField
      type="date"
      label="Ngày tạo"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || '')}
      InputLabelProps={{
        shrink: true,
      }}
      size="small"
      className={styles.statusFilter}
    />
  );

  return (
    <div className={styles.container}>
      {activeLoading && <ContentLoading isLoading={activeLoading} text={activeLoadingText} />}
      
      <ManagementPageHeader
        title={isTemplateTab ? 'Quản lý Mẫu Gói' : 'Quản lý Gói Bán'}
        createButtonText={isTemplateTab ? 'Thêm Mẫu Gói' : 'Thêm Gói Bán'}
        onCreateClick={(() => {
          const currentUser = authService.getCurrentUser();
          const isAdmin = !!(currentUser && (currentUser.role || '').toString().toLowerCase() === 'admin');
          return isTemplateTab ? handleCreateTemplate : isAdmin ? undefined : handleCreatePackage;
        })()}
      />

      <Paper
        className={styles.tabsWrapper}
        elevation={0}
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: 500,
              minHeight: 64,
              padding: '12px 24px',
              color: 'text.secondary',
              transition: 'all 0.3s ease',
              '& .MuiSvgIcon-root': {
                fontSize: 22,
                transition: 'color 0.2s ease'
              },
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                color: 'primary.main'
              },
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#1976d2'
            }
          }}
        >
          <Tab
            value="templates"
            disableRipple
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TemplateTabIcon />
                <Box>
                  <Box component="span" sx={{ display: 'block', fontWeight: 'inherit' }}>
                    Mẫu gói
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 400,
                      opacity: 0.7,
                      mt: 0.25
                    }}
                  >
                    Template
                  </Box>
                </Box>
              </Box>
            }
            sx={{
              '& .MuiSvgIcon-root': {
                color: activeTab === 'templates' ? 'primary.main' : 'inherit'
              }
            }}
          />
          <Tab
            value="packages"
            disableRipple
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PackageIcon />
                <Box>
                  <Box component="span" sx={{ display: 'block', fontWeight: 'inherit' }}>
                    Gói bán
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 400,
                      opacity: 0.7,
                      mt: 0.25
                    }}
                  >
                    Package
                  </Box>
                </Box>
              </Box>
            }
            sx={{
              '& .MuiSvgIcon-root': {
                color: activeTab === 'packages' ? 'primary.main' : 'inherit'
              }
            }}
          />
        </Tabs>
      </Paper>

      {!isTemplateTab && dependenciesError && (
        <Alert severity="warning" className={styles.errorAlert}>
          {dependenciesError}
        </Alert>
      )}

      {isTemplateTab ? (
        <>
          <ManagementSearchSection
            keyword={templateSearchTerm}
            onKeywordChange={templateHandleKeywordChange}
            onSearch={templateHandleKeywordSearch}
            onClear={() => {
              templateHandleClearSearch();
            }}
            placeholder="Tìm kiếm theo tên mẫu gói..."
          />

          {templateError && (
            <Alert severity="error" className={styles.errorAlert}>
              {templateError}
            </Alert>
          )}

          <div className={styles.tableContainer}>
            <DataTable
              data={templates}
              columns={templateColumns}
              loading={templateIsPageLoading}
              page={templatePage}
              rowsPerPage={templateRowsPerPage}
              totalCount={templateTotalCount}
              onPageChange={templateHandlePageChange}
              onRowsPerPageChange={templateHandleRowsPerPageChange}
              onView={handleViewTemplate}
              onEdit={handleEditTemplate}
              onDelete={templateHandleDelete}
              emptyMessage="Chưa có mẫu gói nào. Hãy tạo mẫu đầu tiên để sử dụng lại nhanh chóng."
            />
          </div>

          {/* Template routes replace dialog; keep confirm dialog only */}
          <ConfirmDialog
            open={templateConfirmDialog.open}
            onClose={() => setTemplateConfirmDialog((prev) => ({ ...prev, open: false }))}
            onConfirm={templateConfirmDialog.onConfirm}
            title={templateConfirmDialog.title}
            description={templateConfirmDialog.description}
            confirmText="Xóa"
            cancelText="Hủy"
            confirmColor="error"
          />
        </>
      ) : (
        <>
          <ManagementSearchSection
            keyword={packageSearchTerm}
            onKeywordChange={packageHandleKeywordChange}
            onSearch={packageHandleKeywordSearch}
            onClear={() => {
              packageHandleClearSearch();
              packageUpdateFilter('status', '');
              packageUpdateFilter('branchId', '');
              packageUpdateFilter('date', '');
            }}
            placeholder="Tìm kiếm theo tên gói bán..."
          >
            {renderStatusFilter(packageFilters.status || '', (e) =>
              packageUpdateFilter('status', e.target.value)
            )}
            {renderBranchFilter(packageFilters.branchId || '', (e) =>
              packageUpdateFilter('branchId', e.target.value)
            )}
            {renderDateFilter(packageFilters.date || '', (value) =>
              packageUpdateFilter('date', value)
            )}
      </ManagementSearchSection>

          {packageError && (
            <Alert severity="error" className={styles.errorAlert}>
              {packageError}
        </Alert>
      )}

      <div className={styles.tableContainer}>
        <DataTable
          data={packages}
          columns={packageColumns}
          loading={packageIsPageLoading}
          page={packagePage}
          rowsPerPage={packageRowsPerPage}
          totalCount={packageTotalCount}
          onPageChange={packageHandlePageChange}
          onRowsPerPageChange={packageHandleRowsPerPageChange}
          onView={(pkg) => navigate(`/admin/packages/detail/${pkg.id}`)}
          onEdit={handleEditPackage}
          onDelete={packageHandleDelete}
          emptyMessage="Không có gói bán nào. Hãy thêm gói bán đầu tiên để bắt đầu."
        />
      </div>

      {/* Package routes replace dialog; keep confirm dialog only */}
      <ConfirmDialog
            open={packageConfirmDialog.open}
            onClose={() => setPackageConfirmDialog((prev) => ({ ...prev, open: false }))}
            onConfirm={packageConfirmDialog.onConfirm}
            title={packageConfirmDialog.title}
            description={packageConfirmDialog.description}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmColor="error"
      />
        </>
      )}
    </div>
  );
};

export default PackageManagement;
