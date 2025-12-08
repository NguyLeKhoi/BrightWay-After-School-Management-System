import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import nfcCardService from '../services/nfcCard.service';
import studentService from '../services/student.service';
import userService from '../services/user.service';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Hook để lấy danh sách học sinh đã duyệt, chưa có thẻ NFC, trong chi nhánh của manager
 * @returns {Object} { students, loading, error, refetch }
 */
const useAvailableStudentsForNfc = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailableStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy thông tin manager hiện tại để lấy branchId
      const currentUser = await userService.getCurrentUser();
      const branchId = currentUser?.managerProfile?.branchId || 
                       currentUser?.branchId || 
                       currentUser?.managerBranchId;

      if (!branchId) {
        setError('Không thể xác định chi nhánh của quản lý');
        toast.error('Không thể xác định chi nhánh của quản lý');
        return;
      }

      // Lấy danh sách học sinh đã có thẻ NFC
      const nfcResponse = await nfcCardService.getChildrenWithNfc();
      const childrenArray = Array.isArray(nfcResponse) ? nfcResponse : [];
      
      // Extract học sinh đã có thẻ (chỉ những đứa có nfcCards)
      const studentsWithNfc = new Set();
      childrenArray.forEach(child => {
        // Add nếu học sinh này có thẻ NFC (regardless of status)
        if (child.nfcCards && child.nfcCards.length > 0) {
          studentsWithNfc.add(child.studentId);
        }
      });
      
      // Lấy danh sách TẤT CẢ học sinh trong chi nhánh này (fetch all pages)
      let allStudents = [];
      let pageIndex = 1;
      const pageSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await studentService.getStudentsPaged({
          pageIndex,
          pageSize,
          branchId: branchId
        });
        
        const items = Array.isArray(response?.items) ? response.items : [];
        allStudents = [...allStudents, ...items];
        
        // Check nếu còn trang tiếp theo
        const totalCount = response?.totalCount || 0;
        hasMore = allStudents.length < totalCount && items.length === pageSize;
        pageIndex++;
        
        // Safety break nếu có vấn đề
        if (pageIndex > 50) break;
      }
      
      // Filter chỉ những học sinh đã duyệt (kiểm tra property status hoặc isApproved)
      const approvedStudents = allStudents.filter(student => {
        // Ưu tiên kiểm tra status trước, sau đó isApproved
        const status = student.status;
        const isApproved = student.isApproved;
        
        // Check status (boolean true hoặc string "true")
        if (status !== undefined && status !== null) {
          return status === true || status === 'true' || String(status).toLowerCase() === 'true';
        }
        
        // Fallback kiểm tra isApproved
        if (isApproved !== undefined && isApproved !== null) {
          return isApproved === true || isApproved === 'true' || String(isApproved).toLowerCase() === 'true';
        }
        
        return false;
      });
      
      // Filter học sinh chưa có thẻ NFC
      const availableStudents = approvedStudents.filter(
        student => !studentsWithNfc.has(student.id)
      );
      
      setStudents(availableStudents);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Không thể tải danh sách học sinh';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    error,
    refetch: fetchAvailableStudents
  };
};

export default useAvailableStudentsForNfc;
