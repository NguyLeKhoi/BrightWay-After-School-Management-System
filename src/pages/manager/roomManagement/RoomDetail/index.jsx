import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  ArrowBack,
  MeetingRoom,
  Business,
  People,
  Room as RoomIcon
} from '@mui/icons-material';
import ContentLoading from '../../../../components/Common/ContentLoading';
import roomService from '../../../../services/room.service';
import { useApp } from '../../../../contexts/AppContext';
import styles from './RoomDetail.module.css';

// Convert numeric status to string enum
const convertStatusToEnum = (status) => {
  // Backend returns Vietnamese/English mixed strings or numeric enum (1-4)
  const statusMap = {
    1: 'Active',
    2: 'Inactive',
    3: 'UnderMaintenance',
    4: 'Closed',
    '1': 'Active',
    '2': 'Inactive',
    '3': 'UnderMaintenance',
    '4': 'Closed',
    'Active': 'Active',
    'Inactive': 'Inactive',
    'UnderMaintenance': 'UnderMaintenance',
    'Đang bảo trì': 'UnderMaintenance',
    'Đã đóng': 'Closed',
    'Closed': 'Closed'
  };
  
  if (typeof status === 'string' && ['Active', 'Inactive', 'UnderMaintenance', 'Closed'].includes(status)) {
    return status;
  }
  
  return statusMap[status] || 'Active';
};

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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

        const roomData = await roomService.getRoomById(id);
        setRoom(roomData);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin phòng học';
        setError(errorMessage);
        showGlobalError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, showGlobalError]);

  const handleBack = () => {
    navigate('/manager/rooms');
  };

  if (loading) {
    return (
      <ContentLoading isLoading={true} text="Đang tải thông tin phòng học..." />
    );
  }

  if (error || !room) {
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
            {error || 'Không tìm thấy thông tin phòng học'}
          </Alert>
        </div>
      </div>
    );
  }

  const status = convertStatusToEnum(room.status);
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
              Chi tiết Phòng Học
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Thông tin Phòng Học
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <MeetingRoom sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Tên Phòng
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {room.roomName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <RoomIcon sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Cơ Sở Vật Chất
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {room.facilityName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Business sx={{ color: 'var(--text-secondary)', fontSize: 24, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Chi Nhánh
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {room.branchName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <People sx={{ color: 'var(--text-secondary)', fontSize: 24 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        Sức Chứa
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {room.capacity ? `${room.capacity} người` : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

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
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default RoomDetail;

