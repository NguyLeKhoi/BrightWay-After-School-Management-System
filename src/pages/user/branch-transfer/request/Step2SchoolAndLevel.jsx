import React, { useEffect, useState, useMemo, forwardRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  Alert
} from '@mui/material';
import { School as SchoolIcon, Grade as LevelIcon } from '@mui/icons-material';
import schoolService from '../../../../services/school.service';

const Step2SchoolAndLevel = forwardRef(({
  data: formData = {},
  updateData = () => {},
  schools = [],
  studentLevels = [],
  children = [],
  branches = [],
  isLoading = false
}, ref) => {
  const selectedChild = formData.studentId ? children.find(c => c.id === formData.studentId) : null;
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [filteredLevels, setFilteredLevels] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState(null);
  const [loadingSchoolDetails, setLoadingSchoolDetails] = useState(false);

  // Load all schools on component mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await schoolService.getAllSchools(true); // includeDeleted = true
        const schoolsData = Array.isArray(response)
          ? response
          : (Array.isArray(response?.items) ? response.items : []);
        setAllSchools(schoolsData);
      } catch (error) {

        setAllSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    loadSchools();
  }, []);

  // Load selected school details when targetSchoolId changes
  useEffect(() => {
    const loadSchoolDetails = async () => {
      if (formData.targetSchoolId && formData.changeSchool) {
        try {
          setLoadingSchoolDetails(true);
          const schoolData = await schoolService.getSchoolById(formData.targetSchoolId);
          setSelectedSchoolDetails(schoolData);
        } catch (error) {

          setSelectedSchoolDetails(null);
        } finally {
          setLoadingSchoolDetails(false);
        }
      } else {
        setSelectedSchoolDetails(null);
      }
    };

    loadSchoolDetails();
  }, [formData.targetSchoolId, formData.changeSchool]);

  // Filter schools and levels based on targetBranchId
  useEffect(() => {
    if (formData.targetBranchId && branches.length > 0) {
      const targetBranch = branches.find(b => b.id === formData.targetBranchId);

      // Filter schools that the target branch supports
      if (targetBranch?.schools && targetBranch.schools.length > 0) {
        const branchSchoolIds = targetBranch.schools.map(s => s.id);
        const filtered = allSchools.filter(school => branchSchoolIds.includes(school.id));
        setFilteredSchools(filtered);
      } else {
        // If branch doesn't have school restrictions, show all schools
        setFilteredSchools(allSchools);
      }

      // Filter student levels that the target branch supports
      if (targetBranch?.studentLevels) {
        const branchLevelIds = targetBranch.studentLevels.map(l => l.id);
        setFilteredLevels(studentLevels.filter(level => branchLevelIds.includes(level.id)));
      } else {
        setFilteredLevels(studentLevels);
      }
    } else {
      // If no target branch selected, show all schools and levels
      setFilteredSchools(allSchools);
      setFilteredLevels(studentLevels);
    }
  }, [formData.targetBranchId, branches, allSchools, studentLevels]);

  const handleChangeSchoolToggle = (event) => {
    const checked = event.target.checked;
    updateData({
      ...(formData || {}),
      changeSchool: checked,
      targetSchoolId: checked ? formData?.targetSchoolId : ''
    });
  };

  const handleChangeLevelToggle = (event) => {
    const checked = event.target.checked;
    updateData({
      ...(formData || {}),
      changeLevel: checked,
      targetStudentLevelId: checked ? formData?.targetStudentLevelId : ''
    });
  };

  const handleSchoolChange = (event) => {
    updateData({
      ...(formData || {}),
      targetSchoolId: event.target.value
    });
  };

  const handleLevelChange = (event) => {
    updateData({
      ...(formData || {}),
      targetStudentLevelId: event.target.value
    });
  };

  const currentSchool = useMemo(() => {
    if (!selectedChild) return null;
    
    // First try to get school info directly from child data
    // API might return schoolName or school.name or school.schoolName
    const schoolNameFromChild = selectedChild.schoolName || selectedChild.school?.schoolName || selectedChild.school?.name;
    const schoolIdFromChild = selectedChild.schoolId || selectedChild.school?.id;
    
    // If we have school info from child, return it as is
    if (schoolNameFromChild && schoolIdFromChild) {
      return {
        id: schoolIdFromChild,
        schoolName: schoolNameFromChild,
        name: schoolNameFromChild,
        description: selectedChild.school?.description
      };
    }
    
    // Otherwise, try to find in schools array
    const schoolId = selectedChild.schoolId || selectedChild.school?.id;
    return schoolId ? schools.find(s => s.id === schoolId) : null;
  }, [selectedChild?.schoolId, selectedChild?.school?.id, selectedChild?.schoolName, selectedChild?.school?.schoolName, selectedChild?.school?.name, schools]);
  
  const currentLevel = useMemo(() => {
    if (!selectedChild) return null;
    
    // First try to get level info directly from child data
    // API might return studentLevelName or studentLevel.levelName or studentLevel.name
    const levelNameFromChild = selectedChild.studentLevelName || selectedChild.studentLevel?.levelName || selectedChild.studentLevel?.name;
    const levelIdFromChild = selectedChild.studentLevelId || selectedChild.studentLevel?.id;
    
    // If we have level info from child, return it as is
    if (levelNameFromChild && levelIdFromChild) {
      return {
        id: levelIdFromChild,
        levelName: levelNameFromChild,
        name: levelNameFromChild,
        description: selectedChild.studentLevel?.description
      };
    }
    
    // Otherwise, try to find in studentLevels array
    const levelId = selectedChild.studentLevelId || selectedChild.studentLevel?.id;
    return levelId ? studentLevels.find(l => l.id === levelId) : null;
  }, [selectedChild?.studentLevelId, selectedChild?.studentLevel?.id, selectedChild?.studentLevelName, selectedChild?.studentLevel?.levelName, selectedChild?.studentLevel?.name, studentLevels]);
  
  const targetSchool = useMemo(() => {
    if (!formData.targetSchoolId) return null;

    // First priority: Use loaded school details from API
    if (selectedSchoolDetails && selectedSchoolDetails.id === formData.targetSchoolId) {
      return selectedSchoolDetails;
    }

    // Fallback: Find in filteredSchools (schools available for selection)
    const schoolFromFiltered = filteredSchools.find(s => s.id === formData.targetSchoolId);
    if (schoolFromFiltered) {
      return schoolFromFiltered;
    }

    // Fallback: Find in allSchools (from API)
    const schoolFromAPI = allSchools.find(s => s.id === formData.targetSchoolId);
    if (schoolFromAPI) {
      return schoolFromAPI;
    }

    // Final fallback: Find in schools prop
    const schoolFromProps = schools.find(s => s.id === formData.targetSchoolId);
    return schoolFromProps || null;
  }, [formData.targetSchoolId, selectedSchoolDetails, filteredSchools, allSchools, schools]);

  const targetLevel = useMemo(() =>
    formData.targetStudentLevelId ? studentLevels.find(l => l.id === formData.targetStudentLevelId) : null,
    [formData.targetStudentLevelId, studentLevels]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Thay đổi trường học và cấp độ (tùy chọn)
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Bạn có thể giữ nguyên trường học và cấp độ hiện tại, hoặc thay đổi chúng.
        Nếu thay đổi, bạn sẽ cần tải lên tài liệu hỗ trợ ở bước tiếp theo.
      </Alert>

  {/* Current Information */}
  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
    <Typography variant="h6" gutterBottom color="text.secondary">
      Thông tin hiện tại của {selectedChild?.name || selectedChild?.userName || 'học sinh'}
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {currentSchool ? (
        <Chip
          icon={<SchoolIcon />}
          label={`Trường: ${currentSchool.schoolName}`}
          variant="outlined"
          color="primary"
        />
      ) : (
        <Chip
          icon={<SchoolIcon />}
          label={selectedChild?.schoolId || selectedChild?.school?.id ? "Đang tải thông tin trường..." : "Trường: Chưa cập nhật"}
          variant="outlined"
          color="default"
        />
      )}
      {currentLevel ? (
        <Chip
          icon={<LevelIcon />}
          label={`Cấp độ: ${currentLevel.levelName}`}
          variant="outlined"
          color="secondary"
        />
      ) : (
        <Chip
          icon={<LevelIcon />}
          label={selectedChild?.studentLevelId || selectedChild?.studentLevel?.id ? "Đang tải thông tin cấp độ..." : "Cấp độ: Chưa cập nhật"}
          variant="outlined"
          color="default"
        />
      )}
    </Box>
    {!selectedChild && (
      <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
        Vui lòng chọn học sinh ở bước trước
      </Typography>
    )}
    {selectedChild && (!selectedChild.schoolId || !selectedChild.studentLevelId) && (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Thông tin trường học hoặc cấp độ của học sinh chưa được cập nhật đầy đủ.
          Bạn vẫn có thể tiếp tục tạo yêu cầu chuyển chi nhánh.
        </Typography>
      </Alert>
    )}
  </Paper>

      {/* Change School */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Thay đổi trường học</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.changeSchool || false}
                onChange={handleChangeSchoolToggle}
                disabled={isLoading}
              />
            }
            label={formData.changeSchool ? "Có" : "Không"}
          />
        </Box>

        {formData.changeSchool && (
          <FormControl fullWidth required>
            <InputLabel>Chọn trường học đích</InputLabel>
            <Select
              value={formData.targetSchoolId || ''}
              onChange={handleSchoolChange}
              disabled={isLoading || loadingSchools}
              label="Chọn trường học đích"
            >
              {loadingSchools ? (
                <MenuItem disabled>
                  <Typography>Đang tải danh sách trường học...</Typography>
                </MenuItem>
              ) : filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <MenuItem key={school.id} value={school.id}>
                    <Box>
                      <Typography variant="body1">
                        {school.schoolName || school.name || `School ${school.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {school.description || school.address || 'Không có mô tả'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <Typography>Không có trường học nào khả dụng</Typography>
                </MenuItem>
              )}
            </Select>
            {/* Validation will be handled by StepperForm on submit */}
          </FormControl>
        )}

        {formData.changeSchool && targetSchool && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom color="success.main">
              Sẽ chuyển sang:
            </Typography>
            <Chip
              icon={<SchoolIcon />}
              label={targetSchool.schoolName || targetSchool.name || targetSchool.title || targetSchool.displayName || `Trường ${targetSchool.id}`}
              color="success"
              variant="outlined"
            />
          </Box>
        )}


        {formData.changeSchool && !targetSchool && formData.targetSchoolId && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="warning.main">
              Đang tải thông tin trường học...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Change Student Level */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LevelIcon color="primary" />
            <Typography variant="h6">Thay đổi cấp độ học sinh</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.changeLevel || false}
                onChange={handleChangeLevelToggle}
                disabled={isLoading}
              />
            }
            label={formData.changeLevel ? "Có" : "Không"}
          />
        </Box>

        {formData.changeLevel && (
          <FormControl fullWidth required>
            <InputLabel>Chọn cấp độ học sinh đích</InputLabel>
            <Select
              value={formData.targetStudentLevelId || ''}
              onChange={handleLevelChange}
              disabled={isLoading}
              label="Chọn cấp độ học sinh đích"
            >
              {filteredLevels.map((level) => (
                <MenuItem key={level.id} value={level.id}>
                  <Box>
                    <Typography variant="body1">{level.levelName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {level.description || 'Không có mô tả'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {/* Validation will be handled by StepperForm on submit */}
          </FormControl>
        )}

        {formData.changeLevel && targetLevel && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom color="success.main">
              Sẽ chuyển sang:
            </Typography>
            <Chip
              icon={<LevelIcon />}
              label={targetLevel.levelName || targetLevel.name || `Level ${targetLevel.id}`}
              color="success"
              variant="outlined"
            />
          </Box>
        )}

        {formData.changeLevel && !targetLevel && formData.targetStudentLevelId && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="warning.main">
              Đang tải thông tin cấp độ...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Summary */}
      {(formData.changeSchool || formData.changeLevel) && (
        <Alert severity="warning">
          Bạn đã chọn thay đổi {formData.changeSchool && formData.changeLevel ? 'trường học và cấp độ' :
                                formData.changeSchool ? 'trường học' : 'cấp độ học sinh'}.
          Bạn sẽ cần tải lên tài liệu hỗ trợ ở bước tiếp theo.
        </Alert>
      )}
    </Box>
  );
});

Step2SchoolAndLevel.displayName = 'Step2SchoolAndLevel';

export default Step2SchoolAndLevel;

