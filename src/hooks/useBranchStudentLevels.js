import { useState, useEffect, useCallback } from 'react';
import branchService from '../services/branch.service';

/**
 * Hook to fetch student levels for a specific branch
 * @param {string} branchId - Branch ID
 * @returns {Object} { studentLevels, loading, error, refetch }
 */
const useBranchStudentLevels = (branchId) => {
  const [studentLevels, setStudentLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudentLevels = useCallback(async () => {
    // Ensure branchId is a valid string (not an object)
    let validBranchId = null;
    if (branchId) {
      if (typeof branchId === 'string' && branchId.trim() !== '') {
        validBranchId = branchId.trim();
      } else if (typeof branchId === 'object' && branchId !== null) {
        // If it's an object, try to extract value or id
        const extracted = branchId.value || branchId.id;
        if (extracted) {
          validBranchId = String(extracted);
        } else {
          // If can't extract, reject it
          validBranchId = null;
        }
      } else if (typeof branchId === 'number') {
        validBranchId = String(branchId);
      } else {
        const str = String(branchId);
        // Reject [object Object] and other invalid strings
        if (str !== '[object Object]' && str !== 'null' && str !== 'undefined' && str.trim() !== '') {
          validBranchId = str;
        }
      }
    }

    // Final validation - reject if invalid
    if (!validBranchId || validBranchId === '' || validBranchId === 'null' || validBranchId === 'undefined' || validBranchId === '[object Object]') {
      setStudentLevels([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call branch service to get branch details, which includes studentLevels
      const branch = await branchService.getBranchById(validBranchId);
      
      // Extract studentLevels from branch response
      // Branch response may have studentLevels directly or in branchLevels array
      let extractedLevels = [];
      if (branch?.studentLevels && Array.isArray(branch.studentLevels)) {
        extractedLevels = branch.studentLevels;
      } else if (branch?.branchLevels && Array.isArray(branch.branchLevels)) {
        extractedLevels = branch.branchLevels.map(bl => bl.studentLevel || bl).filter(Boolean);
      }
      
      setStudentLevels(extractedLevels);
    } catch (err) {

      const message = err?.response?.data?.message || err?.message || 'Không thể tải cấp độ học sinh';
      setError(message);
      setStudentLevels([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchStudentLevels();
  }, [fetchStudentLevels]);

  return {
    studentLevels,
    loading,
    error,
    refetch: fetchStudentLevels
  };
};

export default useBranchStudentLevels;


