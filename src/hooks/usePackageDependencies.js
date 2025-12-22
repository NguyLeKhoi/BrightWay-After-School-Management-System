import { useState, useCallback } from 'react';
import benefitService from '../services/benefit.service';
import studentLevelService from '../services/studentLevel.service';
import branchService from '../services/branch.service';

/**
 * Custom hook to fetch package dependencies
 * Returns lists of benefits, student levels, and branches with their IDs and names
 * for use in package creation/editing forms
 */
const usePackageDependencies = () => {
  const [benefits, setBenefits] = useState([]);
  const [studentLevels, setStudentLevels] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false since we don't auto-fetch
  const [error, setError] = useState(null);

  // Fetch dependencies function
  const fetchDependencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dependencies in parallel
      const [benefitsData, studentLevelsData, branchesData] = await Promise.all([
        benefitService.getAllBenefits(),
        studentLevelService.getAllStudentLevels(),
        branchService.getAllBranches()
      ]);

      setBenefits(benefitsData || []);
      setStudentLevels(studentLevelsData || []);
      setBranches(branchesData || []);
    } catch (err) {

      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Don't auto-fetch on mount - only fetch when explicitly called
  // This prevents unnecessary API calls when the hook is used but data isn't needed yet

  // Transform data for easier use in forms
  const benefitOptions = benefits.map(benefit => ({
    id: benefit.id,
    name: benefit.name,
    description: benefit.description,
    isActive: benefit.isActive || benefit.status
  }));

  const studentLevelOptions = studentLevels.map(level => ({
    id: level.id,
    name: level.name,
    description: level.description
  }));

  const branchOptions = branches.map(branch => ({
    id: branch.id,
    name: branch.branchName,
    address: branch.address,
    phone: branch.phone
  }));

  return {
    // Raw data
    benefits,
    studentLevels,
    branches,
    
    // Formatted options for dropdowns
    benefitOptions,
    studentLevelOptions,
    branchOptions,
    
    // State
    loading,
    error,
    
    // Helper functions
    getBenefitById: (id) => benefits.find(b => b.id === id),
    getStudentLevelById: (id) => studentLevels.find(sl => sl.id === id),
    getBranchById: (id) => branches.find(b => b.id === id),
    
    // Fetch function - call this when you actually need the data
    fetchDependencies,
    // Refresh function - alias for fetchDependencies
    refresh: fetchDependencies
  };
};

export default usePackageDependencies;

