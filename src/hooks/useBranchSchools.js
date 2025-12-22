import { useState, useEffect, useCallback } from 'react';
import branchService from '../services/branch.service';

/**
 * Hook to fetch schools for a specific branch
 * @param {string} branchId - Branch ID
 * @returns {Object} { schools, loading, error, refetch }
 */
const useBranchSchools = (branchId) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchools = useCallback(async () => {
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
      setSchools([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call branch service to get branch details, which includes schools
      const branch = await branchService.getBranchById(validBranchId);
      
      // Extract schools from branch response
      // Branch response may have schools directly or in branchSchools array
      let extractedSchools = [];
      if (branch?.schools && Array.isArray(branch.schools)) {
        extractedSchools = branch.schools;
      } else if (branch?.branchSchools && Array.isArray(branch.branchSchools)) {
        extractedSchools = branch.branchSchools.map(bs => bs.school || bs).filter(Boolean);
      }
      
      setSchools(extractedSchools);
    } catch (err) {

      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách trường học';
      setError(message);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return {
    schools,
    loading,
    error,
    refetch: fetchSchools
  };
};

export default useBranchSchools;


