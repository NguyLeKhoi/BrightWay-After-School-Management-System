import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Alert, Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import PageWrapper from '../../../components/Common/PageWrapper';
import ManagementPageHeader from '../../../components/Management/PageHeader';
import ManagementSearchSection from '../../../components/Management/SearchSection';
import ContentLoading from '../../../components/Common/ContentLoading';
import BranchTable from '../../../components/Management/BranchTable';
import AssignBenefitsDialog from '../../../components/Management/AssignBenefitsDialog';
import AssignSchoolsDialog from '../../../components/Management/AssignSchoolsDialog';
import AssignStudentLevelsDialog from '../../../components/Management/AssignStudentLevelsDialog';
import branchService from '../../../services/branch.service';
import benefitService from '../../../services/benefit.service';
import useBaseCRUD from '../../../hooks/useBaseCRUD';
import { useBranchExpandedRows } from '../../../hooks/useBranchExpandedRows';
import { useAssignBenefits } from '../../../hooks/useAssignBenefits';
import { useAssignSchools } from '../../../hooks/useAssignSchools';
import { useAssignStudentLevels } from '../../../hooks/useAssignStudentLevels';
import { createBranchColumns } from '../../../definitions/branch/tableColumns';
import styles from './BranchManagement.module.css';
import { useNavigate, useLocation } from 'react-router-dom';

const BranchManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);


  // Use shared CRUD hook for basic operations
  const {
    data: branches,
    totalCount,
    page,
    rowsPerPage,
    keyword,
    error,
    actionLoading,
    isPageLoading,
    loadingText,
    selectedItem: selectedBranch,
    confirmDialog,
    setConfirmDialog,
    handleDelete,
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    handlePageChange,
    handleRowsPerPageChange,
    loadData
  } = useBaseCRUD({
    loadFunction: async (params) => {
      return await branchService.getBranchesPaged({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        searchTerm: params.searchTerm || params.Keyword || ''
      });
    },
    createFunction: branchService.createBranch,
    updateFunction: branchService.updateBranch,
    deleteFunction: branchService.deleteBranch,
    loadOnMount: true
  });

  // Map of benefit counts per branchId for table display
  const [benefitsCountByBranchId, setBenefitsCountByBranchId] = React.useState({});

  // Fetch benefits count for current page branches
  useEffect(() => {
    const fetchBenefitCounts = async () => {
      if (!branches || branches.length === 0) {
        setBenefitsCountByBranchId({});
        return;
      }
      try {
        const results = await Promise.all(
          (branches || []).map(async (b) => {
            try {
              const assigned = await benefitService.getBenefitsByBranchId(b.id);
              return { id: b.id, count: Array.isArray(assigned) ? assigned.length : 0 };
            } catch (err) {
              return { id: b.id, count: 0 };
            }
          })
        );
        const map = results.reduce((acc, cur) => {
          acc[cur.id] = cur.count;
          return acc;
        }, {});
        setBenefitsCountByBranchId(map);
      } catch (err) {
        // ignore
      }
    };
    fetchBenefitCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  // Expanded rows hook (for managing assigned items state)
  const {
    expandedRows,
    rowBenefits,
    rowSchools,
    rowStudentLevels,
    updateRowBenefits,
    updateRowSchools,
    updateRowStudentLevels
  } = useBranchExpandedRows(branches);

  // Assign benefits hook
  const assignBenefits = useAssignBenefits(expandedRows, updateRowBenefits, loadData);

  // Assign schools hook
  const assignSchools = useAssignSchools(expandedRows, updateRowSchools, loadData);

  // Assign student levels hook
  const assignStudentLevels = useAssignStudentLevels(expandedRows, updateRowStudentLevels, loadData);

  const handleCreateWithData = () => {
    navigate('/admin/branches/create');
  };

  const handleViewDetail = (branch) => {
    navigate(`/admin/branches/detail/${branch.id}`);
  };

  const handleEditWithData = (branch) => {
    navigate(`/admin/branches/update/${branch.id}`);
  };

  const handleRemoveBenefit = (branchId, benefitId, benefitName) => {
    assignBenefits.handleRemove(branchId, benefitId, benefitName, setConfirmDialog);
  };

  const handleRemoveSchool = (branchId, schoolId, schoolName) => {
    assignSchools.handleRemove(branchId, schoolId, schoolName, setConfirmDialog);
  };

  const handleRemoveStudentLevel = (branchId, studentLevelId, studentLevelName) => {
    assignStudentLevels.handleRemove(branchId, studentLevelId, studentLevelName, setConfirmDialog);
  };

  // Reload data when navigate back to this page (e.g., from create/update pages)
  useEffect(() => {
    if (location.pathname === '/admin/branches') {
      // Skip first mount to avoid double loading
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      loadData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Define table columns
  const columns = createBranchColumns({
    onAssignBenefits: assignBenefits.handleOpen,
    onAssignSchools: assignSchools.handleOpen,
    onAssignStudentLevels: assignStudentLevels.handleOpen,
    onViewBranch: handleViewDetail,
    onEditBranch: handleEditWithData,
    onDeleteBranch: handleDelete,
    benefitsCountByBranchId
  });

  return (
    <PageWrapper>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
      {isPageLoading && <ContentLoading isLoading={isPageLoading} text={loadingText} />}
      
      {/* Header */}
      <ManagementPageHeader
        title="Quản lý Chi Nhánh"
        createButtonText="Thêm Chi Nhánh"
        onCreateClick={handleCreateWithData}
      />

      {/* Search Section */}
      <ManagementSearchSection
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearch={handleKeywordSearch}
        onClear={handleClearSearch}
        placeholder="Tìm kiếm theo tên, địa chỉ..."
      />

      {/* Quy trình tạo chi nhánh */}
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Quy trình tạo chi nhánh hoàn chỉnh
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              Để tạo chi nhánh thành công, hãy thực hiện theo thứ tự 3 bước chuẩn bị sau:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Bước 1: Có Lợi Ích */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    1
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    Có Lợi Ích
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/admin/benefits')}
                    sx={{ textTransform: 'none' }}
                  >
                    Quản Lý Lợi Ích
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                  Đảm bảo đã có các lợi ích phù hợp để gán cho chi nhánh (wifi, máy lạnh, parking,...).
                </Typography>
              </Paper>

              {/* Bước 2: Có Trường */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    2
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    Có Trường
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/admin/schools')}
                    sx={{ textTransform: 'none' }}
                  >
                    Quản Lý Trường
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                  Đảm bảo đã có thông tin các trường học để kết nối với chi nhánh.
                </Typography>
              </Paper>

              {/* Bước 3: Có Cấp Độ Học Sinh */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    3
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    Có Cấp Độ Học Sinh
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/admin/student-levels')}
                    sx={{ textTransform: 'none' }}
                  >
                    Quản Lý Cấp Độ Học Sinh
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                  Đảm bảo đã có các cấp độ học sinh phù hợp (Lớp 1, Lớp 2, THCS, THPT,...).
                </Typography>
              </Paper>

              {/* Bước tạo chi nhánh */}
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'success.main',
                  backgroundColor: 'success.50'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    ✓
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    Tạo Chi Nhánh Mới
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => navigate('/admin/branches/create')}
                    sx={{ textTransform: 'none' }}
                  >
                    Tạo Chi Nhánh Ngay
                  </Button>
                </Box>
                <Box sx={{ ml: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sau khi đã chuẩn bị đầy đủ các điều kiện trên, tiến hành tạo chi nhánh:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    <li><Typography variant="body2">Nhập thông tin cơ bản của chi nhánh</Typography></li>
                    <li><Typography variant="body2">Thiết lập địa chỉ và thông tin liên hệ</Typography></li>
                    <li><Typography variant="body2">Gán các lợi ích có sẵn</Typography></li>
                    <li><Typography variant="body2">Kết nối với các trường học</Typography></li>
                    <li><Typography variant="body2">Cấu hình cấp độ học sinh</Typography></li>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Lưu ý quan trọng:</strong> Việc chuẩn bị đầy đủ lợi ích, trường học và cấp độ học sinh
                trước khi tạo chi nhánh sẽ giúp quá trình gán thông tin sau này diễn ra thuận lợi hơn.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className={styles.errorAlert} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <BranchTable
          branches={branches}
          columns={columns}
          isPageLoading={isPageLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
        </div>

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

      {/* Assign Benefits Dialog */}
      <AssignBenefitsDialog
        open={assignBenefits.openDialog}
        onClose={() => assignBenefits.setOpenDialog(false)}
        selectedBranch={assignBenefits.selectedBranch}
        availableBenefits={assignBenefits.availableBenefits}
        assignedBenefits={assignBenefits.assignedBenefits}
        selectedBenefits={assignBenefits.selectedBenefits}
        setSelectedBenefits={assignBenefits.setSelectedBenefits}
        loading={assignBenefits.loading}
        actionLoading={actionLoading}
        onRemove={handleRemoveBenefit}
        onRemoveDirect={assignBenefits.handleRemoveDirect}
        onSubmit={assignBenefits.handleSubmit}
      />

      {/* Assign Schools Dialog */}
      <AssignSchoolsDialog
        open={assignSchools.openDialog}
        onClose={() => assignSchools.setOpenDialog(false)}
        selectedBranch={assignSchools.selectedBranch}
        availableSchools={assignSchools.availableSchools}
        assignedSchools={assignSchools.assignedSchools}
        selectedSchools={assignSchools.selectedSchools}
        setSelectedSchools={assignSchools.setSelectedSchools}
        loading={assignSchools.loading}
        actionLoading={actionLoading}
        onRemove={handleRemoveSchool}
        onRemoveDirect={assignSchools.handleRemoveDirect}
        onSubmit={assignSchools.handleSubmit}
      />

      {/* Assign Student Levels Dialog */}
      <AssignStudentLevelsDialog
        open={assignStudentLevels.openDialog}
        onClose={() => assignStudentLevels.setOpenDialog(false)}
        selectedBranch={assignStudentLevels.selectedBranch}
        availableStudentLevels={assignStudentLevels.availableStudentLevels}
        assignedStudentLevels={assignStudentLevels.assignedStudentLevels}
        selectedStudentLevels={assignStudentLevels.selectedStudentLevels}
        setSelectedStudentLevels={assignStudentLevels.setSelectedStudentLevels}
        loading={assignStudentLevels.loading}
        actionLoading={actionLoading}
        onRemoveDirect={assignStudentLevels.handleRemoveDirect}
        onSubmit={assignStudentLevels.handleSubmit}
      />
      </motion.div>
    </PageWrapper>
  );
};

export default BranchManagement;
