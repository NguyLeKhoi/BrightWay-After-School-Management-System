import { useState, useEffect, useCallback } from 'react';
import locationService from '../services/location.service';

/**
 * Custom hook for managing location data (provinces and districts)
 * Used in branch management forms for selecting province and district
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.filterByBranches - If true, only fetch provinces that have branches
 * @returns {Object} Location data with loading states and helper functions
 */
const useLocationData = (options = {}) => {
  const { filterByBranches = false } = options;
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch provinces based on filter option
  const fetchProvinces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (filterByBranches) {
        response = await locationService.getProvincesWithBranches();
      } else {
        response = await locationService.getAllProvincesWithDistricts();
      }
      
      setProvinces(response || []);
    } catch (err) {

      setError('Không thể tải danh sách tỉnh thành');
    } finally {
      setIsLoading(false);
    }
  }, [filterByBranches]);

  // Fetch districts for selected province
  const fetchDistricts = useCallback(async (provinceId) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await locationService.getDistrictsByProvinceId(provinceId);
      setDistricts(response || []);
    } catch (err) {

      setError('Không thể tải danh sách quận huyện');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Don't auto-fetch provinces on mount - only fetch when explicitly called
  // This prevents unnecessary API calls when the hook is used but data isn't needed yet

  // Fetch districts when province is selected
  useEffect(() => {
    if (selectedProvinceId) {
      fetchDistricts(selectedProvinceId);
    } else {
      setDistricts([]);
    }
  }, [selectedProvinceId, fetchDistricts]);

  // Handle province selection
  const handleProvinceChange = useCallback((provinceId) => {
    setSelectedProvinceId(provinceId);
    // Clear districts when province changes
    setDistricts([]);
  }, []);

  // Get province options for select/dropdown
  const getProvinceOptions = useCallback(() => {
    return provinces.map(province => ({
      value: province.id,
      label: province.name
    }));
  }, [provinces]);

  // Get district options for select/dropdown
  const getDistrictOptions = useCallback(() => {
    return districts.map(district => ({
      value: district.id,
      label: district.name
    }));
  }, [districts]);

  // Get province by ID
  const getProvinceById = useCallback((id) => {
    return provinces.find(province => province.id === id);
  }, [provinces]);

  // Get district by ID
  const getDistrictById = useCallback((id) => {
    return districts.find(district => district.id === id);
  }, [districts]);

  // Reset selections
  const resetSelection = useCallback(() => {
    setSelectedProvinceId(null);
    setDistricts([]);
  }, []);

  return {
    // Data
    provinces,
    districts,
    selectedProvinceId,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    fetchProvinces,
    fetchDistricts,
    handleProvinceChange,
    resetSelection,
    
    // Helpers
    getProvinceOptions,
    getDistrictOptions,
    getProvinceById,
    getDistrictById
  };
};

export default useLocationData;


