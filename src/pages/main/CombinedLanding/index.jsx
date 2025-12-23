import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  ChildCare as ChildCareIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  Favorite as FavoriteIcon,
  Groups as GroupsIcon,
  SportsSoccer as SportsIcon,
  Palette as ArtIcon,
  MenuBook as BookIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Download as DownloadIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ContentLoading from '@components/Common/ContentLoading';
import facilityService from '../../../services/facility.service';
import packageService from '../../../services/package.service';
import { useApp } from '../../../contexts/AppContext';
import styles from './CombinedLanding.module.css';

const CombinedLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showGlobalError } = useApp();
  
  const [facilities, setFacilities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageBenefits, setPackageBenefits] = useState({});
  const heroImageRef = useRef(null);

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoadingFacilities(true);
        const response = await facilityService.getPublicFacilities();
        const facilitiesData = Array.isArray(response) ? response : (response.items || []);
        setFacilities(facilitiesData);
      } catch (error) {

        setFacilities([]);
      } finally {
        setLoadingFacilities(false);
      }
    };
    fetchFacilities();
  }, []);

  // Fetch packages and their benefits
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const response = await packageService.getPublicPackages();
        const packagesData = Array.isArray(response) ? response : (response.items || []);
        setPackages(packagesData);

        // Fetch benefits for each package
        const benefitsMap = {};
        for (const pkg of packagesData) {
          if (pkg.id) {
            try {
              // First check if benefits are in package data
              if (pkg.benefits && Array.isArray(pkg.benefits) && pkg.benefits.length > 0) {
                benefitsMap[pkg.id] = pkg.benefits;
              } else {
                // Fetch from API
                const benefits = await packageService.getPackageBenefits(pkg.id);
                benefitsMap[pkg.id] = Array.isArray(benefits) ? benefits : (benefits.items || []);
              }
            } catch (error) {
              // If API fails, use empty array
              benefitsMap[pkg.id] = [];
            }
          }
        }
        setPackageBenefits(benefitsMap);
      } catch (error) {

        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  // Format price to VND
  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };


  // Features data
  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 50 }} />,
      title: 'An Toàn Tuyệt Đối',
      description: 'Môi trường chăm sóc an toàn với hệ thống giám sát 24/7 và đội ngũ nhân viên được đào tạo chuyên nghiệp'
    },
    {
      icon: <ChildCareIcon sx={{ fontSize: 50 }} />,
      title: 'Chăm Sóc Tận Tâm',
      description: 'Đội ngũ giáo viên và nhân viên yêu trẻ, có kinh nghiệm trong việc chăm sóc và giáo dục trẻ em'
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      title: 'Giáo Dục Toàn Diện',
      description: 'Chương trình học tập và hoạt động đa dạng giúp trẻ phát triển toàn diện về thể chất, trí tuệ và kỹ năng xã hội'
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 50 }} />,
      title: 'Hoạt Động Phong Phú',
      description: 'Nhiều hoạt động ngoại khóa như thể thao, nghệ thuật, đọc sách giúp trẻ phát triển sở thích và tài năng'
    },
    {
      icon: <FavoriteIcon sx={{ fontSize: 50 }} />,
      title: 'Môi Trường Thân Thiện',
      description: 'Không gian vui chơi và học tập thân thiện, khuyến khích trẻ tự do khám phá và sáng tạo'
    },
    {
      icon: <SportsIcon sx={{ fontSize: 50 }} />,
      title: 'Phát Triển Thể Chất',
      description: 'Các hoạt động thể thao và vận động giúp trẻ phát triển sức khỏe và kỹ năng vận động'
    }
  ];

  // Activity types with descriptions
  const activities = [
    {
      icon: <SportsIcon />,
      name: 'Thể Thao',
      image: '/images/TheThao.jpg',
      description: 'Chương trình thể thao đa dạng giúp trẻ phát triển thể chất toàn diện. Các hoạt động bao gồm bóng đá, bóng rổ, bơi lội, võ thuật và nhiều môn thể thao khác. Trẻ sẽ được rèn luyện sức khỏe, tăng cường sự dẻo dai, phát triển kỹ năng vận động và tinh thần đồng đội trong môi trường an toàn và vui vẻ.'
    },
    {
      icon: <ArtIcon />,
      name: 'Nghệ Thuật',
      image: '/images/Nghethuat.jpg',
      description: 'Khám phá thế giới nghệ thuật đầy màu sắc với các hoạt động vẽ tranh, làm thủ công, âm nhạc và biểu diễn. Chương trình nghệ thuật giúp trẻ phát triển trí tưởng tượng, khả năng sáng tạo, cảm thụ nghệ thuật và thể hiện cảm xúc một cách tích cực. Trẻ sẽ được thỏa sức sáng tạo và phát triển tài năng nghệ thuật của mình.'
    },
    {
      icon: <BookIcon />,
      name: 'Đọc Sách',
      image: '/images/Docsach.webp',
      description: 'Xây dựng thói quen đọc sách và phát triển ngôn ngữ cho trẻ. Chương trình đọc sách với thư viện phong phú, các hoạt động kể chuyện, đọc hiểu và thảo luận giúp trẻ mở rộng vốn từ, phát triển tư duy logic, khả năng phân tích và yêu thích việc học hỏi. Trẻ sẽ được khuyến khích khám phá thế giới qua những trang sách.'
    },
    {
      icon: <SchoolIcon />,
      name: 'Học Tập',
      image: '/images/Hoctap.jpg',
      description: 'Chương trình học tập bổ trợ giúp trẻ củng cố kiến thức và phát triển tư duy. Với phương pháp giảng dạy hiện đại, trẻ sẽ được hỗ trợ làm bài tập, ôn tập kiến thức, phát triển kỹ năng giải quyết vấn đề và tư duy sáng tạo. Môi trường học tập tích cực giúp trẻ tự tin và yêu thích việc học.'
    }
  ];

  const [expandedActivity, setExpandedActivity] = useState(null);
  const [currentAppImage, setCurrentAppImage] = useState(0);

  // Mobile App Features
  const appFeatures = [
    {
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      title: 'Quản Lý Lịch Học',
      description: 'Xem lịch học, lịch hoạt động của con mọi lúc mọi nơi. Nhận thông báo về các sự kiện và hoạt động quan trọng.'
    },
    {
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      title: 'Thông Báo Tức Thì',
      description: 'Nhận thông báo ngay lập tức về tình hình học tập, sức khỏe và các hoạt động của con tại trường.'
    },
    {
      icon: <WalletIcon sx={{ fontSize: 40 }} />,
      title: 'Quản Lý Tài Chính',
      description: 'Theo dõi chi phí, thanh toán học phí và các khoản phí khác một cách nhanh chóng và tiện lợi.'
    }
  ];

  // App Screenshots
  const appScreenshots = [
    {
      image: '/images/login.jpg', // Màn hình đăng nhập
      title: 'Đăng Nhập',
      description: 'Giao diện đăng nhập đơn giản và an toàn với nhiều vai trò'
    },
    {
      image: '/images/home.jpg', // Màn hình trang chủ
      title: 'Trang Chủ',
      description: 'Tổng quan thông tin, thao tác nhanh và lớp học sắp tới'
    },
    {
      image: '/images/wallet.jpg', // Màn hình ví tiền
      title: 'Ví Tiền',
      description: 'Quản lý tài chính, nạp tiền và theo dõi số dư dễ dàng'
    },
    {
      image: '/images/schedule.jpg', // Màn hình đặt lịch
      title: 'Đặt Lịch Học',
      description: 'Đặt lịch học cho con một cách nhanh chóng và tiện lợi'
    },
    {
      image: '/images/booked.jpg', // Màn hình phòng đã đặt
      title: 'Phòng Đã Đặt',
      description: 'Xem lịch học và phòng đã đặt của con theo tuần'
    },
    {
      image: '/images/profile.jpg', // Màn hình hồ sơ
      title: 'Hồ Sơ Cá Nhân',
      description: 'Quản lý thông tin cá nhân và thành viên gia đình'
    }
  ];

  // Auto slide app screenshots
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAppImage((prev) => (prev + 1) % appScreenshots.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [appScreenshots.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Box className={styles.landingPage}>
      {/* Hero Section */}
      <Box className={styles.heroSection} id="section-homepage">
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h1"
                  className={styles.heroTitle}
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 800,
                    mb: 2,
                    background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  BRIGHTWAY
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2
                  }}
                >
                  Nơi Ươm Mầm Tương Lai
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    color: theme.palette.text.secondary,
                    mb: 4,
                    lineHeight: 1.8
                  }}
                >
                  Hệ thống quản lý nhà trẻ chuyên nghiệp, mang đến môi trường chăm sóc an toàn, 
                  giáo dục toàn diện và các hoạt động phong phú cho trẻ em sau giờ học.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/contact')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: 6
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Đăng Ký Ngay
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      const element = document.getElementById('section-packages');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderColor: '#1abc9c',
                      color: '#1abc9c',
                      '&:hover': {
                        borderColor: '#16a085',
                        backgroundColor: alpha('#1abc9c', 0.1),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Xem Gói Dịch Vụ
                  </Button>
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ perspective: '1000px' }}
              >
                <Box
                  ref={heroImageRef}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: '400px', md: '500px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(26, 188, 156, 0.2) 0%, rgba(22, 160, 133, 0.2) 100%)',
                      borderRadius: '20px',
                      zIndex: 0,
                      transition: 'transform 0.3s ease'
                    }
                  }}
                  onMouseMove={(e) => {
                    if (!heroImageRef.current) return;
                    const rect = heroImageRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 15;
                    const rotateY = (centerX - x) / 15;
                    
                    heroImageRef.current.style.transform = `
                      perspective(1000px) 
                      rotateX(${rotateX}deg) 
                      rotateY(${rotateY}deg) 
                      scale3d(1.05, 1.05, 1.05)
                    `;
                    
                    // Update background gradient position
                    const beforeElement = heroImageRef.current.querySelector('::before') || 
                      heroImageRef.current.parentElement?.querySelector('::before');
                  }}
                  onMouseLeave={() => {
                    if (heroImageRef.current) {
                      heroImageRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                    }
                  }}
                >
                  <motion.img
                    src="/images/Anh1homepage.png"
                    alt="Gia đình vui vẻ tại BRIGHTWAY"
                    style={{
                      width: '90%',
                      height: 'auto',
                      maxWidth: '450px',
                      objectFit: 'contain',
                      borderRadius: '20px',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.1s ease-out',
                      transformStyle: 'preserve-3d',
                      filter: 'drop-shadow(0 20px 40px rgba(26, 188, 156, 0.3))'
                    }}
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  {/* Floating decorative elements */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(26, 188, 156, 0.3) 0%, rgba(22, 160, 133, 0.3) 100%)',
                      backdropFilter: 'blur(10px)',
                      zIndex: -1,
                      pointerEvents: 'none'
                    }}
                    animate={{
                      y: [0, 20, 0],
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5
                    }}
                  />
                  <motion.div
                    style={{
                      position: 'absolute',
                      bottom: '15%',
                      right: '15%',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(251, 192, 45, 0.3) 0%, rgba(241, 196, 15, 0.3) 100%)',
                      backdropFilter: 'blur(10px)',
                      zIndex: -1,
                      pointerEvents: 'none'
                    }}
                    animate={{
                      y: [0, -25, 0],
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className={styles.featuresSection} sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Tại Sao Chọn BRIGHTWAY?
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontSize: '1.1rem',
                color: theme.palette.text.secondary,
                mb: 6,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Chúng tôi cam kết mang đến dịch vụ chăm sóc trẻ tốt nhất với đội ngũ chuyên nghiệp và cơ sở vật chất hiện đại
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'center',
                      p: 3,
                      borderRadius: '16px',
                      boxShadow: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                        bgcolor: alpha('#1abc9c', 0.05)
                      }
                    }}
                  >
                    <Box
                      sx={{
                        color: '#1abc9c',
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: '60px',
                        alignItems: 'center'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: theme.palette.text.primary,
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        flexGrow: 1,
                        minHeight: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Activities Section */}
      <Box className={styles.activitiesSection} sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Hoạt Động Đa Dạng
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontSize: '1.1rem',
                color: theme.palette.text.secondary,
                mb: 4,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Các hoạt động phong phú giúp trẻ phát triển toàn diện
            </Typography>
          </motion.div>

          <Grid container spacing={3} justifyContent="center">
            {activities.map((activity, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    onClick={() => setExpandedActivity(expandedActivity === index ? null : index)}
                    sx={{
                      textAlign: 'center',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      bgcolor: 'white',
                      border: '2px solid',
                      borderColor: expandedActivity === index ? '#1abc9c' : alpha('#1abc9c', 0.3),
                      transition: 'all 0.3s ease',
                      boxShadow: expandedActivity === index ? 8 : 2,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#1abc9c',
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '180px',
                        overflow: 'hidden',
                        bgcolor: alpha('#1abc9c', 0.1)
                      }}
                    >
                      <Box
                        component="img"
                        src={activity.image}
                        alt={activity.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = 'linear-gradient(135deg, rgba(26, 188, 156, 0.2) 0%, rgba(22, 160, 133, 0.2) 100%)';
                        }}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          transform: expandedActivity === index ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.text.primary, mb: 1 }}>
                        {activity.name}
                      </Typography>
                      
                      {/* Expandable Description */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: expandedActivity === index ? 'auto' : 0,
                          opacity: expandedActivity === index ? 1 : 0
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Box
                          sx={{
                            pt: expandedActivity === index ? 2 : 0,
                            borderTop: expandedActivity === index ? `1px solid ${alpha('#1abc9c', 0.2)}` : 'none',
                            mt: expandedActivity === index ? 2 : 0
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              lineHeight: 1.7,
                              textAlign: 'left',
                              fontSize: '0.9rem'
                            }}
                          >
                            {activity.description}
                          </Typography>
                        </Box>
                      </motion.div>
                      
                      {/* Expand/Collapse Indicator */}
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1abc9c',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        <motion.div
                          animate={{ rotate: expandedActivity === index ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowForwardIcon 
                            sx={{ 
                              fontSize: 16,
                              transform: 'rotate(90deg)'
                            }} 
                          />
                        </motion.div>
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {expandedActivity === index ? 'Thu gọn' : 'Xem thêm'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Packages Section */}
      <Box className={styles.packagesSection} id="section-packages" sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Gói Dịch Vụ
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontSize: '1.1rem',
                color: theme.palette.text.secondary,
                mb: 6,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Chọn gói dịch vụ phù hợp nhất cho con bạn
            </Typography>
          </motion.div>

          {loadingPackages ? (
            <ContentLoading text="Đang tải danh sách gói dịch vụ..." />
          ) : packages.length > 0 ? (
            <Grid container spacing={4} justifyContent="center">
              {packages.slice(0, 3).map((pkg) => {
                const isPro = pkg.name?.toLowerCase().includes('pro');
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      whileHover={isPro ? { scale: 1.02 } : {}}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          position: 'relative',
                          border: isPro 
                            ? '3px solid transparent'
                            : '2px solid',
                          borderColor: isPro 
                            ? 'transparent'
                            : alpha('#1abc9c', 0.3),
                          background: isPro
                            ? 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #1abc9c 0%, #16a085 50%, #1abc9c 100%) border-box'
                            : 'white',
                          boxShadow: isPro ? 8 : 3,
                          transition: 'all 0.4s ease',
                          '&:hover': {
                            transform: isPro ? 'translateY(-12px) scale(1.02)' : 'translateY(-8px)',
                            boxShadow: isPro ? 12 : 8
                          },
                          '&::before': isPro ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #1abc9c 0%, #16a085 50%, #1abc9c 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 3s ease-in-out infinite',
                            zIndex: 1
                          } : {}
                        }}
                      >
                        {/* Pro Badge */}
                        {isPro && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              zIndex: 2,
                              bgcolor: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                              color: 'white',
                              px: 2,
                              py: 0.5,
                              borderRadius: '20px',
                              boxShadow: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <StarIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                              PRO
                            </Typography>
                          </Box>
                        )}

                        {pkg.imageUrl && (
                          <Box
                            sx={{
                              position: 'relative',
                              height: '200px',
                              overflow: 'hidden',
                              '&::after': isPro ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(180deg, rgba(26, 188, 156, 0.1) 0%, transparent 100%)',
                                pointerEvents: 'none'
                              } : {}
                            }}
                          >
                            <CardMedia
                              component="img"
                              height="200"
                              image={pkg.imageUrl}
                              alt={pkg.name}
                              sx={{
                                transition: 'transform 0.4s ease',
                                '&:hover': {
                                  transform: isPro ? 'scale(1.15)' : 'scale(1.1)'
                                }
                              }}
                            />
                          </Box>
                        )}
                        
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                fontWeight={700}
                                sx={{
                                  color: isPro ? '#1abc9c' : theme.palette.text.primary,
                                  fontSize: isPro ? '1.25rem' : '1.1rem',
                                  flex: 1
                                }}
                              >
                                {pkg.name || 'Gói dịch vụ'}
                              </Typography>
                            </Box>
                            
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              mb: 2, 
                              minHeight: '60px',
                              lineHeight: 1.7,
                              fontSize: '0.9rem'
                            }}
                          >
                            {pkg.desc || 'Không có mô tả'}
                          </Typography>

                          {/* Benefits Section - hiển thị trực tiếp trên card */}
                          {(packageBenefits[pkg.id] && packageBenefits[pkg.id].length > 0) && (
                            <Box sx={{ mb: 2 }}>
                              <Stack spacing={0.75}>
                                {packageBenefits[pkg.id].slice(0, 3).map((benefit, index) => (
                                  <Box
                                    key={benefit.id || index}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}
                                  >
                                    <CheckCircleIcon
                                      sx={{
                                        fontSize: 18,
                                        color: '#1abc9c',
                                        flexShrink: 0
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: '0.85rem',
                                        color: 'text.secondary',
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {benefit.name || benefit.benefitName || benefit}
                                    </Typography>
                                  </Box>
                                ))}
                                {packageBenefits[pkg.id].length > 3 && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: '0.85rem',
                                      fontStyle: 'italic',
                                      color: 'text.secondary',
                                      ml: 3.5
                                    }}
                                  >
                                    +{packageBenefits[pkg.id].length - 3} lợi ích khác...
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          )}
                          
                          <Stack spacing={1}>
                            {pkg.price && (
                              <Box>
                                <Typography 
                                  variant="h5" 
                                  sx={{
                                    fontWeight: 800,
                                    background: isPro 
                                      ? 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)'
                                      : 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontSize: isPro ? '1.75rem' : '1.5rem'
                                  }}
                                >
                                  {formatPrice(pkg.price)}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                        
                        <CardActions sx={{ p: 3, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate('/contact')}
                            size="large"
                            sx={{
                              bgcolor: isPro 
                                ? 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)'
                                : '#1abc9c',
                              background: isPro 
                                ? 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)'
                                : '#1abc9c',
                              color: 'white',
                              fontWeight: 700,
                              py: 1.5,
                              fontSize: '1rem',
                              borderRadius: '12px',
                              boxShadow: isPro ? 4 : 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: isPro
                                  ? 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)'
                                  : '#16a085',
                                transform: isPro ? 'translateY(-2px)' : 'none',
                                boxShadow: isPro ? 6 : 4
                              }
                            }}
                          >
                            Đăng Ký Ngay
                          </Button>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Hiện tại chưa có gói dịch vụ nào. Vui lòng quay lại sau.
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Facilities Section */}
      <Box id="section-facilities" className={styles.facilitiesSection} sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Cơ Sở Vật Chất
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontSize: '1.1rem',
                color: theme.palette.text.secondary,
                mb: 6,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Môi trường chăm sóc trẻ an toàn và hiện đại
            </Typography>
          </motion.div>

          {loadingFacilities ? (
            <ContentLoading text="Đang tải thông tin cơ sở vật chất..." />
          ) : facilities.length > 0 ? (
            <Grid container spacing={4}>
              {facilities.slice(0, 6).map((facility) => (
                <Grid item xs={12} sm={6} md={4} key={facility.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        boxShadow: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 8
                        }
                      }}
                    >
                      <CardContent 
                        sx={{ 
                          p: 3,
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          gutterBottom
                          sx={{ 
                            color: '#1abc9c',
                            mb: 2,
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {facility.facilityName || 'Cơ sở vật chất'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            lineHeight: 1.7,
                            flexGrow: 1,
                            minHeight: '60px'
                          }}
                        >
                          {facility.description || 'Không có mô tả'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Hiện tại chưa có cơ sở vật chất nào. Vui lòng quay lại sau.
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Mobile App Section */}
      <Box id="section-mobile-app" className={styles.mobileAppSection} sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary
                  }}
                >
                  Ứng Dụng Di Động BRIGHTWAY
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    color: theme.palette.text.secondary,
                    mb: 4,
                    lineHeight: 1.8
                  }}
                >
                  Quản lý thông tin con bạn một cách dễ dàng và tiện lợi ngay trên điện thoại. 
                  Ứng dụng BRIGHTWAY giúp phụ huynh theo dõi lịch học, nhận thông báo, 
                  quản lý tài chính và tương tác với nhà trường mọi lúc mọi nơi.
                </Typography>

                {/* App Features */}
                <Stack spacing={3} sx={{ mb: 4 }}>
                  {appFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box
                          sx={{
                            color: '#1abc9c',
                            bgcolor: alpha('#1abc9c', 0.1),
                            borderRadius: '12px',
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '64px',
                            height: '64px'
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Stack>

              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  {/* Phone Mockup with Carousel */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: '280px', md: '350px' },
                      height: { xs: '560px', md: '700px' },
                      bgcolor: '#1a1a1a',
                      borderRadius: '40px',
                      p: 2,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60px',
                        height: '6px',
                        bgcolor: '#333',
                        borderRadius: '3px',
                        zIndex: 1
                      }
                    }}
                  >
                    {/* Screen Content with Carousel */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        bgcolor: 'white',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      {appScreenshots.map((screenshot, index) => (
                        <motion.div
                          key={index}
                          initial={false}
                          animate={{
                            opacity: currentAppImage === index ? 1 : 0,
                            scale: currentAppImage === index ? 1 : 0.95
                          }}
                          transition={{ duration: 0.5 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                          }}
                        >
                          <Box
                            component="img"
                            src={screenshot.image}
                            alt={screenshot.title}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.style.background = 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)';
                              e.target.parentElement.style.display = 'flex';
                              e.target.parentElement.style.alignItems = 'center';
                              e.target.parentElement.style.justifyContent = 'center';
                              e.target.parentElement.style.flexDirection = 'column';
                            }}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        </motion.div>
                      ))}
                    </Box>
                  </Box>

                  {/* Navigation Dots */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {appScreenshots.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentAppImage(index)}
                        sx={{
                          width: currentAppImage === index ? 32 : 8,
                          height: 8,
                          borderRadius: '4px',
                          bgcolor: currentAppImage === index ? '#1abc9c' : alpha('#1abc9c', 0.3),
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: currentAppImage === index ? '#16a085' : alpha('#1abc9c', 0.5)
                          }
                        }}
                      />
                    ))}
                  </Box>

                  {/* Current Screenshot Info */}
                  <Box sx={{ textAlign: 'center', maxWidth: '350px' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                      {appScreenshots[currentAppImage]?.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appScreenshots[currentAppImage]?.description}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        className={styles.ctaSection}
        sx={{
          py: 8,
          background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
          color: 'white'
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 2
              }}
            >
              Sẵn Sàng Bắt Đầu?
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontSize: '1.1rem',
                mb: 4,
                opacity: 0.95
              }}
            >
              Liên hệ với chúng tôi ngay hôm nay để tìm hiểu thêm về các dịch vụ của BRIGHTWAY
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<PhoneIcon />}
                onClick={() => navigate('/contact')}
                sx={{
                  bgcolor: 'white',
                  color: '#1abc9c',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                    transform: 'translateY(-2px)',
                    boxShadow: 6
                  }
                }}
              >
                Liên Hệ Ngay
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<EmailIcon />}
                onClick={() => navigate('/contact')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha('#fff', 0.1),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Gửi Email
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default CombinedLanding;

