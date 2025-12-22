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
  ShowChart as ChartIcon
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
import { useApp } from '../../../contexts/AppContext';
import { useLoading } from '../../../hooks/useLoading';
import Loading from '../../../components/Common/Loading';
import styles from './dashboard.module.css';

const ManagerDashboard = () => {
  const { showGlobalError } = useApp();
  const { isLoading, loadingText, showLoading, hideLoading } = useLoading();
  const [overviewData, setOverviewData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

        {/* Transactions Chart */}
        {transactionsByDate.length > 0 && (
          <Grid item xs={12}>
            <AnimatedCard delay={0.6} className={styles.infoCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <ChartIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Biểu Đồ Giao Dịch ({getMonthName(selectedMonth)}/{selectedYear})
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={transactionsByDate.map(daily => ({
                      date: daily.dateLabel || new Date(daily.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                      fullDate: daily.dateLabel || new Date(daily.date).toLocaleDateString('vi-VN'),
                      count: daily.transactionCount || 0,
                      amount: Number(daily.totalAmount) || 0
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      yAxisId="amount"
                      orientation="left"
                      stroke="#1976d2"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                    />
                    <YAxis 
                      yAxisId="count"
                      orientation="right"
                      stroke="#2e7d32"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'amount') {
                          return [formatCurrency(value), 'Tổng Tiền'];
                        }
                        return [formatNumber(value), 'Số Lượng'];
                      }}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'amount') return 'Tổng Tiền (₫)';
                        if (value === 'count') return 'Số Lượng';
                        return value;
                      }}
                    />
                    <Area
                      yAxisId="amount"
                      type="monotone"
                      dataKey="amount"
                      stroke="#1976d2"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                      name="amount"
                    />
                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey="count"
                      stroke="#2e7d32"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name="count"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
        )}

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

