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
  Alert,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as PackageIcon,
  AttachMoney as MoneyIcon,
  AccountTree as BranchIcon,
  ShowChart as ChartIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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
import { formatDateOnlyUTC7, formatDateTimeUTC7 } from '../../../utils/dateHelper';
import styles from './Dashboard.module.css';

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

const AdminDashboard = () => {
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
      const data = await overviewService.getAdminOverview({
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

  const usersByRole = overviewData?.usersByRole || {};
  const newestUsers = overviewData?.newestUsers || [];
  const systemTransactions = overviewData?.systemTransactions || {};
  const branchTransactions = overviewData?.branchTransactions || [];
  const transactionsByDate = overviewData?.transactionsByDate || [];

  // Prepare data for charts
  const usersByRoleData = Object.entries(usersByRole).map(([role, count]) => ({
    name: role,
    value: count
  }));

  const branchTransactionsData = branchTransactions.map(branch => ({
    name: branch.branchName,
    count: branch.totalCount,
    amount: Number(branch.totalAmount) || 0
  }));

  const totalUsers = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);
  const totalTransactions = systemTransactions.totalCount || 0;
  const totalRevenue = systemTransactions.totalAmount || 0;

  const stats = [
    {
      title: 'Tổng Người Dùng',
      value: formatNumber(totalUsers),
      icon: <PeopleIcon />,
      color: '#1976d2',
      subtitle: `${Object.keys(usersByRole).length} vai trò`
    },
    {
      title: 'Gói Dịch Vụ',
      value: formatNumber(overviewData?.activePackageCount || 0),
      icon: <PackageIcon />,
      color: '#2e7d32',
      subtitle: 'Gói đang hoạt động'
    },
    {
      title: 'Tổng Giao Dịch',
      value: formatNumber(totalTransactions),
      icon: <MoneyIcon />,
      color: '#f57c00',
      subtitle: formatCurrency(totalRevenue)
    },
    {
      title: 'Chi Nhánh',
      value: formatNumber(branchTransactions.length),
      icon: <BranchIcon />,
      color: '#7b1fa2',
      subtitle: branchTransactions.length > 0 
        ? `Có giao dịch trong ${getMonthName(selectedMonth)}/${selectedYear}`
        : `Không có giao dịch trong ${getMonthName(selectedMonth)}/${selectedYear}`
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
              Tổng quan Quản Trị
            </h1>
            <p className={styles.subtitle}>
              Tổng quan hệ thống quản lý
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
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <AnimatedCard key={index} delay={index * 0.1} className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>
                  {stat.title}
                </span>
                <div className={styles.statIcon} style={{ color: stat.color }}>
                  {Icon}
                </div>
              </div>
              <p className={styles.statValue}>
                {stat.value}
              </p>
              {stat.subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  {stat.subtitle}
                </Typography>
              )}
            </AnimatedCard>
          );
        })}
      </div>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Users by Role Chart */}
        {usersByRoleData.length > 0 && (
          <Grid item xs={12} md={6}>
            <AnimatedCard delay={0.4} className={styles.chartCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <PeopleIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Người Dùng Theo Vai Trò
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => formatNumber(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
        )}

        {/* Branch Transactions Chart */}
        {branchTransactionsData.length > 0 && (
          <Grid item xs={12} md={6}>
            <AnimatedCard delay={0.45} className={styles.chartCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <BranchIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Giao Dịch Theo Chi Nhánh
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={branchTransactionsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#1976d2"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
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
                      formatter={(value, name) => {
                        if (name === 'amount') return [formatCurrency(value), 'Doanh Thu'];
                        return [formatNumber(value), 'Số Lượng'];
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'count') return 'Số Lượng';
                        if (value === 'amount') return 'Doanh Thu (₫)';
                        return value;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#1976d2" radius={[8, 8, 0, 0]} name="count" />
                    <Bar yAxisId="right" dataKey="amount" fill="#2e7d32" radius={[8, 8, 0, 0]} name="amount" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
        )}

        {/* Transactions by Type Charts */}
        {systemTransactions.countByType && Object.keys(systemTransactions.countByType).length > 0 && (
          <>
            <Grid item xs={12} md={6}>
              <AnimatedCard delay={0.5} className={styles.chartCard}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <MoneyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    Giao Dịch Theo Loại (Số Lượng)
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={Object.entries(systemTransactions.countByType || {}).map(([type, count]) => ({
                        type: type,
                        count: count || 0
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="type" 
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
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
              <AnimatedCard delay={0.55} className={styles.chartCard}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <TrendingUpIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    Giao Dịch Theo Loại (Doanh Thu)
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={Object.entries(systemTransactions.amountByType || {}).map(([type, amount]) => ({
                        type: type,
                        amount: Number(amount) || 0
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="type" 
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
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
          </>
        )}

        {/* Transactions by Date Chart */}
        {transactionsByDate.length > 0 && (
          <Grid item xs={12}>
            <AnimatedCard delay={0.6} className={styles.chartCard}>
              <Box sx={{ mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ChartIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    Giao Dịch Theo Ngày ({getMonthName(selectedMonth)}/{selectedYear})
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 5.5 }}>
                  Biểu đồ thể hiện số lượng giao dịch và tổng doanh thu theo từng ngày trong tháng. 
                  Trục bên trái (màu xanh dương) hiển thị tổng tiền, trục bên phải (màu xanh lá) hiển thị số lượng giao dịch.
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={transactionsByDate.map(daily => ({
                      date: daily.dateLabel || new Date(daily.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                      fullDate: daily.dateLabel || new Date(daily.date).toLocaleDateString('vi-VN'),
                      count: daily.transactionCount || 0,
                      amount: Math.abs(Number(daily.totalAmount) || 0) // Ensure positive value for display
                    }))}
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAmountAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCountAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Ngày trong tháng', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#666' } }}
                    />
                    <YAxis 
                      yAxisId="amount"
                      orientation="left"
                      stroke="#1976d2"
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Tổng Tiền (₫)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#1976d2' } }}
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
                      label={{ value: 'Số Lượng Giao Dịch', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#2e7d32' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'amount') {
                          return [formatCurrency(value), 'Tổng Doanh Thu'];
                        }
                        return [formatNumber(value), 'Số Lượng Giao Dịch'];
                      }}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'amount') return 'Tổng Doanh Thu (₫)';
                        if (value === 'count') return 'Số Lượng Giao Dịch';
                        return value;
                      }}
                    />
                    <Area
                      yAxisId="amount"
                      type="monotone"
                      dataKey="amount"
                      stroke="#1976d2"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmountAdmin)"
                      name="amount"
                    />
                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey="count"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCountAdmin)"
                      name="count"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </AnimatedCard>
          </Grid>
        )}

        {/* Newest Users Table */}
        {newestUsers.length > 0 && (
          <Grid item xs={12}>
            <AnimatedCard delay={0.7} className={styles.chartCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <PeopleIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Người Dùng Mới Nhất
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Người Dùng</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Vai Trò</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Ngày Đăng Ký</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newestUsers.map((user, index) => (
                      <TableRow key={user.id || index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              src={user.profilePictureUrl} 
                              alt={user.name}
                              sx={{ width: 40, height: 40 }}
                            >
                              {user.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {user.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.roleName || 'N/A'} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.createdAt ? formatDateOnlyUTC7(user.createdAt) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isActive ? 'Hoạt động' : 'Không hoạt động'} 
                            size="small" 
                            color={user.isActive ? 'success' : 'default'} 
                            variant="outlined"
                          />
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

export default AdminDashboard;

