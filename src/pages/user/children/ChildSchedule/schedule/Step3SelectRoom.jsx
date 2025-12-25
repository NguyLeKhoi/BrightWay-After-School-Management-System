import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import ContentLoading from '../../../../../components/Common/ContentLoading';
import packageService from '../../../../../services/package.service';
import { useApp } from '../../../../../contexts/AppContext';
import { Alert, Button } from '@mui/material';
import styles from './Schedule.module.css';

const Step3SelectRoom = forwardRef(({ data, updateData, stepIndex, totalSteps }, ref) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(data?.roomId || '');
  const [parentNote, setParentNote] = useState(data?.parentNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [error, setError] = useState(null);
  const [packageError, setPackageError] = useState(null);
  const [validPackage, setValidPackage] = useState(null);
  const { showGlobalError } = useApp();

  useImperativeHandle(ref, () => ({
    submit: async () => {
      // Validate package before proceeding (room is optional)
      if (!validPackage) {
        setPackageError('Gói của đứa trẻ không hợp lệ cho ca giữ trẻ này. Vui lòng chọn slot khác hoặc kiểm tra lại gói.');
        return false;
      }

      // Room is optional - if selected, use it; otherwise null
      const selectedRoom = selectedRoomId ? rooms.find(r => r.id === selectedRoomId) : null;
      updateData({ 
        roomId: selectedRoomId || null,
        room: selectedRoom || null,
        subscriptionId: validPackage.id,
        subscriptionName: validPackage.name,
        parentNote: parentNote.trim()
      });
      return true;
    }
  }));

  useEffect(() => {
    // Lấy rooms từ slot data thay vì gọi API riêng
    if (data?.slot?.rooms || data?.slot?.staff) {
      const roomsData = Array.isArray(data.slot.rooms) ? data.slot.rooms : [];
      const staffList = Array.isArray(data.slot.staff) ? data.slot.staff : [];
      
      // Nếu rooms đã có staff trong mỗi room object
      const mapped = roomsData.map((room) => {
        const roomId = room.id || room.roomId;
        
        // Lấy staff từ room.staff nếu có
        let roomStaff = [];
        if (room.staff) {
          roomStaff = Array.isArray(room.staff) ? room.staff : [room.staff];
        } else {
          // Group staff từ slot.staff theo roomId
          roomStaff = staffList.filter(staff => {
            const staffRoomId = staff.roomId || staff.room?.id;
            return staffRoomId && String(staffRoomId) === String(roomId);
          });
        }
        
        return {
          id: roomId,
          name: room.roomName || room.name || 'N/A',
          facilityName: room.facilityName || 'N/A',
          capacity: room.capacity || 0,
          availableCapacity: room.availableCapacity ?? room.capacity ?? 0, // Sức chứa còn lại
          staff: roomStaff.map(staff => ({
            id: staff.staffId || staff.id,
            name: staff.staffName || staff.name || 'N/A',
            role: staff.staffRole || staff.role || 'N/A'
          }))
        };
      });

      // Chỉ hiển thị phòng có staff
      const roomsWithStaff = mapped.filter(room => room.staff && room.staff.length > 0);

      setRooms(roomsWithStaff);
      setIsLoading(false);
      setError(null);
    } else if (data?.slotId) {
      // Nếu slot có ID nhưng không có rooms trong data, rooms có thể rỗng
      // Không gọi API riêng nữa vì endpoint available slots đã có rooms
      setRooms([]);
      setIsLoading(false);
      setError(null);
    } else {
      setRooms([]);
      setIsLoading(false);
    }
  }, [data?.slot?.rooms, data?.slot?.staff, data?.slotId]);

  useEffect(() => {
    if (data?.studentId && data?.slot) {
      validatePackage(data.studentId, data.slot);
    }
  }, [data?.studentId, data?.slot]);

  useEffect(() => {
    if (data?.roomId) {
      setSelectedRoomId(data.roomId);
    }
  }, [data?.roomId]);

  const validatePackage = async (studentId, slot) => {
    if (!studentId || !slot) {
      return;
    }

    setLoadingPackage(true);
    setPackageError(null);
    setValidPackage(null);

    try {
      // Get student's active subscriptions
      const subscriptionsResponse = await packageService.getSubscriptionsByStudent(studentId);
      let subscriptions = [];
      
      if (Array.isArray(subscriptionsResponse)) {
        subscriptions = subscriptionsResponse;
      } else if (Array.isArray(subscriptionsResponse?.items)) {
        subscriptions = subscriptionsResponse.items;
      } else if (subscriptionsResponse?.id) {
        subscriptions = [subscriptionsResponse];
      }

      // Filter active subscriptions
      const activeSubscriptions = subscriptions.filter(
        sub => sub.status?.toLowerCase() === 'active'
      );

      if (activeSubscriptions.length === 0) {
        setPackageError('Đứa trẻ này chưa có gói đang hoạt động. Vui lòng mua gói trước.');
        return;
      }

      // Check if any subscription's package is allowed for this slot
      // Backend already filters slots by allowed packages, but we need to find which subscription to use
      // We'll use the first active subscription (since backend ensures it's compatible)
      const firstActiveSubscription = activeSubscriptions[0];
      
      // Verify the package is in allowed packages for this slot
      const allowedPackageIds = slot.allowedPackages?.map(pkg => pkg.id) || [];
      const subscriptionPackageId = firstActiveSubscription.packageId || firstActiveSubscription.package?.id;
      
      if (allowedPackageIds.length > 0 && subscriptionPackageId) {
        if (!allowedPackageIds.includes(subscriptionPackageId)) {
          setPackageError('Gói của đứa trẻ không được phép sử dụng cho ca giữ trẻ này. Vui lòng chọn slot khác.');
          return;
        }
      }

      // Package is valid
      setValidPackage({
        id: firstActiveSubscription.id,
        name: firstActiveSubscription.packageName || 'Gói không tên'
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể kiểm tra gói';
      setPackageError(errorMessage);
      showGlobalError(errorMessage);
    } finally {
      setLoadingPackage(false);
    }
  };

  const handleRoomSelect = (roomId) => {
    if (selectedRoomId === roomId) {
      setSelectedRoomId('');
      updateData({ 
        roomId: null,
        room: null
      });
      return;
    }

    setSelectedRoomId(roomId);
    const selectedRoom = rooms.find(r => r.id === roomId);
    updateData({ 
      roomId: roomId,
      room: selectedRoom
    });
  };

  if (!data?.slotId || !data?.slot) {
    return (
      <div className={styles.stepContainer}>
        <div className={styles.emptyState}>
          <h3>Vui lòng chọn slot trước</h3>
          <p>Bạn cần chọn slot ở bước trước để chọn phòng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Bước {stepIndex + 1}/{totalSteps}: Chọn phòng <span style={{ color: 'var(--danger)', marginLeft: 8 }}>*</span></h2>
        <p className={styles.stepSubtitle}>
          Chọn phòng cho ca giữ trẻ và kiểm tra gói hợp lệ. <strong style={{ color: 'var(--danger)' }}>Bắt buộc chọn phòng</strong>
        </p>
      </div>

      {loadingPackage && (
        <ContentLoading isLoading={true} text="Đang kiểm tra gói..." />
      )}

      {packageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {packageError}
        </Alert>
      )}

      {validPackage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Gói "{validPackage.name}" hợp lệ cho ca giữ trẻ này.
        </Alert>
      )}

      {isLoading ? (
        <ContentLoading isLoading={isLoading} text="Đang tải danh sách phòng..." />
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      ) : rooms.length > 0 ? (
        <div className={styles.scheduleGrid}>
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`${styles.scheduleCard} ${
                selectedRoomId === room.id ? styles.scheduleCardSelected : ''
              }`}
              onClick={() => handleRoomSelect(room.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardLabel}>Phòng</p>
                  <h3 className={styles.cardTitle}>{room.name}</h3>
                </div>
              </div>

              <div className={styles.infoGrid}>
                <div>
                  <p className={styles.infoLabel}>Cơ sở</p>
                  <p className={styles.infoValue}>{room.facilityName || '—'}</p>
                </div>
                <div>
                  <p className={styles.infoLabel}>Sức chứa còn lại</p>
                  <p className={styles.infoValue}>{room.availableCapacity ?? room.capacity ?? 0} chỗ</p>
                </div>
              </div>

              {room.staff && room.staff.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                  <p className={styles.infoLabel} style={{ marginBottom: '8px' }}>Nhân viên phụ trách</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {room.staff.map((staff, index) => (
                      <div key={staff.id || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          • {staff.name} {staff.role && `(${staff.role})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRoomId === room.id && (
                <div className={styles.selectedIndicator}>
                  ✓ Đã chọn
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                {selectedRoomId === room.id ? (
                  <Button variant="outlined" size="small" disabled>
                    Đã chọn
                  </Button>
                ) : (
                  <Button variant="contained" size="small" onClick={() => handleRoomSelect(room.id)}>
                    Chọn phòng
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚪</div>
          <h3>Chưa có phòng nào có nhân viên</h3>
          <p>Ca giữ trẻ này chưa có phòng nào được gán nhân viên. Vui lòng chọn slot khác hoặc liên hệ quản lý.</p>
          <button
            className={styles.retryButton}
            onClick={() => setSelectedRoomId('')}
            style={{ marginTop: '16px' }}
          >
            Tiếp tục không chọn phòng
          </button>
        </div>
      )}

      {/* Parent Note Section */}
      <div className={styles.noteSection} style={{ marginTop: '24px' }}>
        <label htmlFor="parentNote" className={styles.noteLabel}>
          Ghi chú cho giáo viên (không bắt buộc)
        </label>
        <textarea
          id="parentNote"
          className={styles.noteTextarea}
          placeholder="Nhập ghi chú về tình trạng sức khỏe, dị ứng, hoặc yêu cầu đặc biệt..."
          value={parentNote}
          onChange={(e) => {
            setParentNote(e.target.value);
            updateData({ parentNote: e.target.value });
          }}
          rows={4}
          maxLength={500}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <span>Ví dụ: Bé bị dị ứng hải sản, vui lòng lưu ý khi cho ăn</span>
          <span>{parentNote.length}/500 ký tự</span>
        </div>
      </div>
    </div>
  );
});

Step3SelectRoom.displayName = 'Step3SelectRoom';

export default Step3SelectRoom;

