import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import { 
  ArrowBack,
  Business,
  LocationOn,
  Phone,
  School,
  Grade,
  LocalOffer
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import branchService from '../../../../services/branch.service';
import benefitService from '../../../../services/benefit.service';
import { useApp } from '../../../../contexts/AppContext';
import styles from './BranchDetail.module.css';

// Convert numeric status or Vietnamese string to string enum
const convertStatusToEnum = (status) => {
  const statusMap = {
    0: 'Active',
    1: 'Active',
    2: 'Inactive',
    3: 'UnderMaintenance',
    4: 'Closed',
    '0': 'Active',
    '1': 'Active',
    '2': 'Inactive',
    '3': 'UnderMaintenance',
    '4': 'Closed',
    'Active': 'Active',
    'Inactive': 'Inactive',
    'UnderMaintenance': 'UnderMaintenance',
    'Closed': 'Closed',
    // Map Vietnamese status strings from API
    'Hoạt động': 'Active',
    'Không hoạt động': 'Inactive',
    'Ngừng hoạt động': 'Inactive',
    'Đang bảo trì': 'UnderMaintenance',
    'Đã đóng': 'Closed'
  };
  
  // If already a string enum, return as is
  if (typeof status === 'string' && ['Active', 'Inactive', 'UnderMaintenance', 'Closed'].includes(status)) {
    return status;
  }
  
  // Check if status exists in map
  if (statusMap[status] !== undefined) {
    return statusMap[status];
  }
  
  // Try case-insensitive match for Vietnamese strings
  if (typeof status === 'string') {
    const statusLower = status.trim().toLowerCase();
    for (const [key, value] of Object.entries(statusMap)) {
      if (typeof key === 'string' && key.toLowerCase() === statusLower) {
        return value;
      }
    }
  }
  
  return 'Active';
};

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [benefitsError, setBenefitsError] = useState(null);
  
  // Pagination states for Schools
  const [schoolsPage, setSchoolsPage] = useState(0);
  const [schoolsRowsPerPage, setSchoolsRowsPerPage] = useState(10);
  
  // Pagination states for Student Levels
  const [studentLevelsPage, setStudentLevelsPage] = useState(0);
  const [studentLevelsRowsPerPage, setStudentLevelsRowsPerPage] = useState(10);

  // Pagination states for Benefits
  const [benefitsPage, setBenefitsPage] = useState(0);
  const [benefitsRowsPerPage, setBenefitsRowsPerPage] = useState(10);


  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [branchData, benefitsData] = await Promise.all([
          branchService.getBranchById(id),
          benefitService.getBenefitsByBranchId(id).catch(() => [])
        ]);
        setBranch(branchData);
        setBenefits(Array.isArray(benefitsData) ? benefitsData : []);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin chi nhánh';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  const handleBack = () => {
    navigate('/admin/branches');
  };

  // Paginated schools data
  const paginatedSchools = useMemo(() => {
    if (!branch?.schools) return [];
    const startIndex = schoolsPage * schoolsRowsPerPage;
    const endIndex = startIndex + schoolsRowsPerPage;
    return branch.schools.slice(startIndex, endIndex);
  }, [branch?.schools, schoolsPage, schoolsRowsPerPage]);

  // Paginated student levels data
  const paginatedStudentLevels = useMemo(() => {
    if (!branch?.studentLevels) return [];
    const startIndex = studentLevelsPage * studentLevelsRowsPerPage;
    const endIndex = startIndex + studentLevelsRowsPerPage;
    return branch.studentLevels.slice(startIndex, endIndex);
  }, [branch?.studentLevels, studentLevelsPage, studentLevelsRowsPerPage]);

  // Paginated benefits data
  const paginatedBenefits = useMemo(() => {
    if (!benefits || benefits.length === 0) return [];
    const startIndex = benefitsPage * benefitsRowsPerPage;
    const endIndex = startIndex + benefitsRowsPerPage;
    return benefits.slice(startIndex, endIndex);
  }, [benefits, benefitsPage, benefitsRowsPerPage]);

  const handleSchoolsPageChange = (event, newPage) => {
    setSchoolsPage(newPage);
  };

  const handleSchoolsRowsPerPageChange = (event) => {
    setSchoolsRowsPerPage(parseInt(event.target.value, 10));
    setSchoolsPage(0);
  };

  const handleStudentLevelsPageChange = (event, newPage) => {
    setStudentLevelsPage(newPage);
  };

  const handleStudentLevelsRowsPerPageChange = (event) => {
    setStudentLevelsRowsPerPage(parseInt(event.target.value, 10));
    setStudentLevelsPage(0);
  };

  const handleBenefitsPageChange = (event, newPage) => {
    setBenefitsPage(newPage);
  };

  const handleBenefitsRowsPerPageChange = (event) => {
    setBenefitsRowsPerPage(parseInt(event.target.value, 10));
    setBenefitsPage(0);
  };


  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin chi nhánh..." />
    );
  }

  if (error || !branch) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          <Alert severity="error">
            {error || 'Không tìm thấy thông tin chi nhánh'}
          </Alert>
        </div>
      </div>
    );
  }

  const status = convertStatusToEnum(branch.status);
  const statusLabels = {
    'Active': 'Hoạt động',
    'Inactive': 'Không hoạt động',
    'UnderMaintenance': 'Đang bảo trì',
    'Closed': 'Đã đóng'
  };
  const statusColors = {
    'Active': 'success',
    'Inactive': 'default',
    'UnderMaintenance': 'warning',
    'Closed': 'error'
  };
  const fullAddress = [branch.address, branch.districtName, branch.provinceName]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{
            padding: 3,
            marginBottom: 3,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              variant="contained"
              sx={{
                borderRadius: 'var(--radius-lg)',
                textTransform: 'none',
                fontFamily: 'var(--font-family)',
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                boxShadow: 'var(--shadow-sm)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)',
                  boxShadow: 'var(--shadow-md)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Quay lại
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                flex: 1
              }}
            >
              Chi tiết Chi Nhánh
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Branch Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Thông tin Chi Nhánh
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Business sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Tên Chi Nhánh
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {branch.branchName || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Trạng Thái
                        </Typography>
                        <Chip
                          label={statusLabels[status] || status}
                          color={statusColors[status] || 'default'}
                          size="small"
                          sx={{ width: 'fit-content' }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <LocationOn sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Địa Chỉ
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {fullAddress || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Phone sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                          Số Điện Thoại
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {branch.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Schools Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <School sx={{ fontSize: 24, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Trường Học ({branch.schools?.length || 0})
                  </Typography>
                </Box>
                {branch.schools && branch.schools.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tên Trường</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Địa Chỉ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Số Điện Thoại</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedSchools.map((school, index) => (
                            <TableRow key={school.id} hover>
                              <TableCell>
                                {schoolsPage * schoolsRowsPerPage + index + 1}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <School sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2" fontWeight="medium">
                                    {school.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {school.address || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {school.phoneNumber || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {school.email || 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={branch.schools.length}
                      page={schoolsPage}
                      onPageChange={handleSchoolsPageChange}
                      rowsPerPage={schoolsRowsPerPage}
                      onRowsPerPageChange={handleSchoolsRowsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Số dòng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
                      }
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Chưa có trường học nào được gán
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Student Levels Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Grade sx={{ fontSize: 24, color: 'warning.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Cấp Độ Học Sinh ({branch.studentLevels?.length || 0})
                  </Typography>
                </Box>
                {branch.studentLevels && branch.studentLevels.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tên Cấp Độ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Mô Tả</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedStudentLevels.map((level, index) => (
                            <TableRow key={level.id} hover>
                              <TableCell>
                                {studentLevelsPage * studentLevelsRowsPerPage + index + 1}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Grade sx={{ fontSize: 18, color: 'warning.main' }} />
                                  <Typography variant="body2" fontWeight="medium">
                                    {level.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {level.description || 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={branch.studentLevels.length}
                      page={studentLevelsPage}
                      onPageChange={handleStudentLevelsPageChange}
                      rowsPerPage={studentLevelsRowsPerPage}
                      onRowsPerPageChange={handleStudentLevelsRowsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Số dòng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
                      }
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Chưa có cấp độ học sinh nào được gán
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Benefits Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalOffer sx={{ fontSize: 24, color: 'success.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Lợi Ích ({benefits?.length || 0})
                  </Typography>
                </Box>
                {benefits && benefits.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tên Lợi Ích</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Mô Tả</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedBenefits.map((benefit, index) => (
                            <TableRow key={benefit.id || index} hover>
                              <TableCell>
                                {benefitsPage * benefitsRowsPerPage + index + 1}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocalOffer sx={{ fontSize: 18, color: 'success.main' }} />
                                  <Typography variant="body2" fontWeight="medium">
                                    {benefit.name || benefit.benefitName || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {benefit.description || benefit.benefitDescription || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={(benefit.status === true || benefit.isActive === true) ? 'Hoạt động' : 'Không hoạt động'}
                                  color={(benefit.status === true || benefit.isActive === true) ? 'success' : 'default'}
                                  size="small"
                                  sx={{ width: 'fit-content' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={benefits.length}
                      page={benefitsPage}
                      onPageChange={handleBenefitsPageChange}
                      rowsPerPage={benefitsRowsPerPage}
                      onRowsPerPageChange={handleBenefitsRowsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Số dòng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
                      }
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Chưa có lợi ích nào được gán cho chi nhánh này
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default BranchDetail;
