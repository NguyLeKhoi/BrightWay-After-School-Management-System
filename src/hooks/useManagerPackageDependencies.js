import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import packageTemplateService from '../services/packageTemplate.service';
import studentLevelService from '../services/studentLevel.service';
import benefitService from '../services/benefit.service';

const useManagerPackageDependencies = () => {
  const { user } = useAuth();
  const managerBranchId =
    user?.branchId ||
    user?.managerProfile?.branchId ||
    user?.managerBranchId ||
    null;

  const [templates, setTemplates] = useState([]);
  const [studentLevels, setStudentLevels] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDependencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the manager-specific endpoint which relies on current auth to return branch benefits.
      // This avoids relying on `user.branchId` being populated synchronously.
      const [templateData, studentLevelData, benefitData] = await Promise.all([
        packageTemplateService.getAllTemplates(),
        studentLevelService.getAllStudentLevels(),
        benefitService.getMyBranchBenefits()
      ]);
      setTemplates(templateData || []);
      setStudentLevels(studentLevelData || []);
      setBenefits(benefitData || []);
      return true;
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể tải dữ liệu phụ trợ.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [managerBranchId]);

  const templateOptions = useMemo(
    () =>
      templates.map((template) => ({
        value: template.id,
        label: template.name
      })),
    [templates]
  );

  const studentLevelOptions = useMemo(
    () =>
      studentLevels.map((level) => ({
        value: level.id,
        label: level.name
      })),
    [studentLevels]
  );

  const benefitOptions = useMemo(
    () =>
      benefits.map((benefit) => ({
        value: benefit.id,
        label: benefit.name
      })),
    [benefits]
  );

  return {
    templates,
    templateOptions,
    studentLevels,
    benefits,
    benefitOptions,
    loading,
    error,
    studentLevelOptions,
    fetchDependencies
  };
};

export default useManagerPackageDependencies;


