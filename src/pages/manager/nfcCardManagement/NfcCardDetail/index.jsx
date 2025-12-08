import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack,
  CreditCard as CardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Business as BranchIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FamilyRestroom as ParentIcon,
  Layers as LevelIcon
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import nfcCardService from '../../../../services/nfcCard.service';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { toast } from 'react-toastify';
import styles from './NfcCardDetail.module.css';

const NfcCardDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all children with NFC to find this student
      const response = await nfcCardService.getChildrenWithNfc();
      const childrenArray = Array.isArray(response) ? response : [];
      
      // Find the student
      const foundStudent = childrenArray.find(child => child.studentId === studentId);
      
      if (!foundStudent) {
        setError('Không tìm thấy thông tin học sinh');
        return;
      }
      
      setStudent(foundStudent);
      setCards(foundStudent.nfcCards || []);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể tải thông tin thẻ NFC';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/manager/nfc-cards');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <ContentLoading isLoading={true} text="Đang tải thông tin..." />;
  }

  if (error || !student) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 3 }}
          >
            Quay lại
          </Button>
          <Alert severity="error">{error || 'Không tìm thấy thông tin'}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CardIcon sx={{ color: 'var(--color-primary)', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}
              >
                Chi tiết Thẻ NFC
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thông tin chi tiết về thẻ NFC của học sinh
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Student Information */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)',
                height: '100%'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PersonIcon color="primary" />
                Thông tin học sinh
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Avatar and Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={student.image && student.image !== 'string' ? student.image : undefined}
                    sx={{
                      width: 80,
                      height: 80,
                      border: '3px solid var(--color-primary-50)'
                    }}
                  >
                    {student.studentName?.[0]?.toUpperCase() || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {student.studentName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {student.studentId}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Branch */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BranchIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Chi nhánh
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {student.branchName || 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                {/* Student Level */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LevelIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Cấp độ
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {student.studentLevelName || 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                {/* Parent */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ParentIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Phụ huynh
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ pl: 4 }}>
                    {student.parentName || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* NFC Cards */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                padding: 3,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-primary)',
                height: '100%'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CardIcon color="primary" />
                Danh sách thẻ NFC
              </Typography>

              {cards.length === 0 ? (
                <Alert severity="info">Học sinh chưa có thẻ NFC nào</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cards.map((card, index) => (
                    <Card
                      key={card.id || index}
                      elevation={0}
                      sx={{
                        border: '2px solid',
                        borderColor: card.status?.toLowerCase() === 'active' ? 'var(--color-success)' : 'var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: card.status?.toLowerCase() === 'active' ? 'rgba(76, 175, 80, 0.05)' : 'var(--bg-secondary)'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Card UID */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Mã thẻ (UID)
                            </Typography>
                            <Typography
                              variant="h6"
                              fontFamily="monospace"
                              sx={{
                                wordBreak: 'break-all',
                                color: 'var(--color-primary)'
                              }}
                            >
                              {card.cardUid || 'N/A'}
                            </Typography>
                          </Box>

                          {/* Status */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Trạng thái
                            </Typography>
                            <Chip
                              icon={card.status?.toLowerCase() === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                              label={card.status?.toLowerCase() === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                              color={card.status?.toLowerCase() === 'active' ? 'success' : 'default'}
                              size="small"
                              variant={card.status?.toLowerCase() === 'active' ? 'filled' : 'outlined'}
                            />
                          </Box>

                          {/* Issue Date */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Ngày cấp
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {formatDate(card.issuedDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default NfcCardDetail;
