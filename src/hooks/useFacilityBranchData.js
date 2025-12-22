import { useState, useCallback } from 'react';
import facilityService from '../services/facility.service';
import branchService from '../services/branch.service';

/**
 * Custom hook to fetch and manage facility and branch data
 * Used for creating rooms that require facilityId and branchId
 * 
 * @returns {Object} Facility and branch data with loading states
 */
const useFacilityBranchData = () => {
  const [facilities, setFacilities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch facilities
  const fetchFacilities = useCallback(async () => {
    try {
      const response = await facilityService.getAllFacilities();
      setFacilities(response || []);
    } catch (err) {

      setError('Không thể tải danh sách cơ sở vật chất');
    }
  }, []);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const response = await branchService.getAllBranches();
      setBranches(response || []);
    } catch (err) {

      setError('Không thể tải danh sách chi nhánh');
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchFacilities(),
        fetchBranches()
      ]);
    } catch (err) {

      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFacilities, fetchBranches]);

  // Don't auto-fetch on mount - only fetch when explicitly called
  // This prevents unnecessary API calls when the hook is used but data isn't needed yet

  // Get facility options for select
  const getFacilityOptions = useCallback(() => {
    return facilities.filter(Boolean).map(facility => ({
      value: facility.id,
      label: facility.facilityName
    }));
  }, [facilities]);

  // Get branch options for select
  const getBranchOptions = useCallback(() => {
    return branches.filter(Boolean).map(branch => ({
      value: branch.id,
      label: branch.branchName
    }));
  }, [branches]);

  // Get facility by ID
  const getFacilityById = useCallback((id) => {
    return facilities.find(facility => facility.id === id);
  }, [facilities]);

  // Get branch by ID
  const getBranchById = useCallback((id) => {
    return branches.find(branch => branch.id === id);
  }, [branches]);

  return {
    // Data
    facilities,
    branches,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    fetchAllData,
    fetchFacilities,
    fetchBranches,
    
    // Helpers
    getFacilityOptions,
    getBranchOptions,
    getFacilityById,
    getBranchById
  };
};

export default useFacilityBranchData;

