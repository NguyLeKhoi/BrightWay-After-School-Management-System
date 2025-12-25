import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  ShoppingCart as PackageIcon,
  Event as SlotIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  ShowChart as ChartIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AnimatedCard from '../../../components/Common/AnimatedCard';
import overviewService from '../../../services/overview.service';
import useManagerNotifications from '../../../hooks/useManagerNotifications';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { useLoading } from '../../../hooks/useLoading';
import Loading from '../../../components/Common/Loading';
import styles from './dashboard.module.css';
import { parseAsUTC7, formatDateTimeUTC7, getCurrentTimeUTC7 } from '../../../utils/dateHelper';

const ManagerDashboard = () => {
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useLoading();
  const [overviewData, setOverviewData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  // Notifications for manager (small widget on dashboard)
  const {
    notifications: managerNotifications,
    unreadCount: managerUnreadCount,
    isLoading: managerNotificationsLoading,
    handleNotificationClick: handleManagerNotificationClick
  } = useManagerNotifications();

  const getNotificationIcon = (iconName) => {
    const iconProps = { sx: { fontSize: 20, color: 'white' } };
    const lower = (iconName || '').toLowerCase();
    const paymentKeywords = ['payment','pay','paid','deposit','refund','package','subscription','wallet','transaction','billing','invoice'];
    const isPayment = paymentKeywords.some(k => lower.includes(k));
    if (isPayment) return <MoneyIcon {...iconProps} sx={{ fontSize: 20, color: 'white' }} />;
    return <NotificationIcon {...iconProps} sx={{ fontSize: 20, color: 'white' }} />;
  };

  const getNotificationColor = (iconName) => {
    const lower = (iconName || '').toLowerCase();
    if (lower.includes('attendance')) return '#28a745';
    if (lower.includes('payment')) return '#007bff';
    if (lower.includes('schedule')) return '#ffc107';
    if (lower.includes('allowance')) return '#17a2b8';
    if (lower.includes('announcement')) return '#dc3545';
    if (lower.includes('evaluation')) return '#6f42c1';
    return '#6c757d';
  };

  const formatNotifTime = (timeString) => {
    if (!timeString) return '';
    const dateUTC7 = parseAsUTC7(timeString);
    if (!dateUTC7) return '';
    const nowUTC7Ms = getCurrentTimeUTC7();
    const dateUTC7Ms = dateUTC7.getTime();
    const diffInMs = nowUTC7Ms - dateUTC7Ms;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} giờ trước`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    return formatDateTimeUTC7(dateUTC7, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    try {
      showLoading('Đang tải dữ liệu...');
      setError(null);
      const data = await overviewService.getManagerOverview({
        month: selectedMonth,
        year: selectedYear
      });
      setOverviewData(data);
    } catch (err) {
      const errorMessage = err?.message || 'Không thể tải dữ liệu dashboard';
      setError(errorMessage);
      showGlobalError(errorMessage);

    } finally {
      hideLoading();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getMonthName = (month) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return months[month - 1] || '';
  };

  if (isLoading && !overviewData) {
    return <Loading text={loadingText} />;
  }

  if (error && !overviewData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const transactions = overviewData?.transactions || {};
  const mostBoughtPackages = overviewData?.mostBoughtPackages || [];
  const mostBookedSlotTypes = overviewData?.mostBookedSlotTypes || [];
  const transactionsByDate = overviewData?.transactionsByDate || [];

  const stats = [
    {
      title: 'Tổng Giao Dịch',
      value: formatNumber(transactions.totalCount || 0),
      icon: <MoneyIcon />,
      color: '#1976d2',
      subtitle: formatCurrency(transactions.totalAmount || 0)
    },
    {
      title: 'Gói Dịch Vụ',
      value: formatNumber(overviewData?.branchPackageCount || 0),
      icon: <PackageIcon />,
      color: '#2e7d32',
      subtitle: 'Gói đang hoạt động'
    },
    {
      title: 'Loại Ca Phổ Biến',
      value: formatNumber(mostBookedSlotTypes.length),
      icon: <SlotIcon />,
      color: '#f57c00',
      subtitle: 'Loại ca được đặt nhiều nhất'
    }
  ];

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <h1 className={styles.title}>
              Tổng quan Quản Lý
            </h1>
            <p className={styles.subtitle}>
              Chào mừng đến với hệ thống quản lý chi nhánh
            </p>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Tháng</InputLabel>
              <Select
                value={selectedMonth}
                label="Tháng"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <MenuItem key={month} value={month}>
                    {getMonthName(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Năm</InputLabel>
              <Select
                value={selectedYear}
                label="Năm"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <AnimatedCard key={index} delay={index * 0.1} className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className={styles.statValue}>
              {stat.value}
            </div>
            <div className={styles.statLabel}>
              {stat.title}
            </div>
            {stat.subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {stat.subtitle}
              </Typography>
            )}
          </AnimatedCard>
        ))}
      </div>

      {/* Notifications Widget */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={12}>
          <AnimatedCard delay={0.6} className={styles.infoCard}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <CalendarIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                Thông báo
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                  {managerUnreadCount || 0} chưa đọc
                </Typography>
              </Box>
            </Box>

            {managerNotificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                {(managerNotifications || []).slice(0, 4).map((notif) => (
                  <Paper
                    key={notif.id}
                    variant="outlined"
                    sx={{ display: 'flex', gap: 2, p: 2, mb: 1, alignItems: 'center', cursor: 'pointer', borderColor: notif.isRead ? 'divider' : 'primary.main' }}
                    onClick={() => handleManagerNotificationClick(notif, navigate)}
                  >
                    <Box sx={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: getNotificationColor(notif.iconName) }}>
                      {getNotificationIcon(notif.iconName)}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={!notif.isRead ? 600 : 500}>
                        {notif.title || 'Thông báo'}
                      </Typography>
                      {notif.message && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notif.message}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ ml: 2, textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotifTime(notif.time)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}

                {(!managerNotifications || managerNotifications.length === 0) && (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Chưa có thông báo</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={() => navigate('/manager/notifications')}>
                    Xem tất cả
                  </Typography>
                </Box>
              </Box>
            )}
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Transaction Summary Chart */}
      {transactions && (transactions.countByType && Object.keys(transactions.countByType).length > 0) && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <AnimatedCard delay={0.3} className={styles.infoCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <MoneyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Giao Dịch Theo Loại (Số Lượng)
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={Object.entries(transactions.countByType || {}).map(([type, count]) => ({
                      type: type,
                      count: count || 0
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="type" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => [formatNumber(value), 'Số Lượng']}
                    />
                    <Bar dataKey="count" fill="#1976d2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <AnimatedCard delay={0.35} className={styles.infoCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TrendingUpIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Giao Dịch Theo Loại (Doanh Thu)
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={Object.entries(transactions.amountByType || {}).map(([type, amount]) => ({
                      type: type,
                      amount: Number(amount) || 0
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="type" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#2e7d32"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Doanh Thu']}
                    />
                    <Bar dataKey="amount" fill="#2e7d32" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Most Bought Packages */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.4} className={styles.infoCard}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <PackageIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                Gói Dịch Vụ Bán Chạy
              </Typography>
            </Box>
            {mostBoughtPackages.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Tên Gói</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Số Lượng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Doanh Thu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mostBoughtPackages.map((pkg, index) => (
                      <TableRow key={pkg.packageId || index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {pkg.packageName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(pkg.subscriptionCount)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(pkg.totalRevenue)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AnimatedCard>
        </Grid>

        {/* Most Booked Slot Types */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.5} className={styles.infoCard}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <SlotIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                Loại Ca Được Đặt Nhiều Nhất
              </Typography>
            </Box>
            {mostBookedSlotTypes.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Loại Ca</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Tổng Đặt</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Đã Hoàn Thành</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mostBookedSlotTypes.map((slotType, index) => (
                      <TableRow key={slotType.slotTypeId || index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {slotType.slotTypeName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(slotType.totalBookings)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(slotType.completedBookings)} 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AnimatedCard>
        </Grid>

        {/* Transactions Chart removed as requested */}

        {/* Transactions by Date Table - Only show if there are transactions */}
        {transactionsByDate.filter(d => d.transactionCount > 0).length > 0 && (
          <Grid item xs={12}>
            <AnimatedCard delay={0.7} className={styles.infoCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <CalendarIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Chi Tiết Giao Dịch Theo Ngày
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Ngày</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Số Lượng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Tổng Tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactionsByDate
                      .filter(daily => daily.transactionCount > 0)
                      .map((daily, index) => (
                        <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {daily.dateLabel || new Date(daily.date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={formatNumber(daily.transactionCount)} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {formatCurrency(daily.totalAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AnimatedCard>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
};

export default ManagerDashboard;

