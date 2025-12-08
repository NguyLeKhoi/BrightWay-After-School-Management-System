import { useState, useCallback, useEffect } from 'react';
import timeframeService from '../services/timeframe.service';
import slotTypeService from '../services/slotType.service';
import roomService from '../services/room.service';
import userService from '../services/user.service';
import studentLevelService from '../services/studentLevel.service';

/**
 * Custom hook to fetch branch slot dependencies
 * Returns lists of timeframes, slot types, rooms, and staff with their IDs and names
 * for use in branch slot creation/editing forms
 */
const useBranchSlotDependencies = (branchId = null) => {
  const [timeframes, setTimeframes] = useState([]);
  const [slotTypes, setSlotTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [studentLevels, setStudentLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dependencies function
  const fetchDependencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dependencies in parallel
      // For staff and rooms, use the dedicated endpoints to get data in manager's branch
      // These endpoints automatically filter by the current manager's branch
      const fetchPromises = [
        timeframeService.getAllTimeframes(),
        // Only fetch slot types when branchId is known; otherwise, keep empty to avoid cross-branch leakage
        branchId ? slotTypeService.getAllSlotTypes({ branchId }) : Promise.resolve([]),
        roomService.getRoomsInMyBranch(1, 1000), // Get rooms in manager's branch
        userService.getStaffInMyBranch({ 
          pageIndex: 1, 
          pageSize: 1000
        }),
        studentLevelService.getAllStudentLevels(branchId) // Get student levels, optionally filtered by branch
      ];

      const [timeframesData, slotTypesDataRaw, roomsResponse, staffResponse, studentLevelsData] = await Promise.all(fetchPromises);
      // Normalize slot type list (trust BE filtering by branchId)
      const slotTypesData = Array.isArray(slotTypesDataRaw?.items)
        ? slotTypesDataRaw.items
        : (Array.isArray(slotTypesDataRaw) ? slotTypesDataRaw : []);
      
      const roomsData = roomsResponse?.items || [];
      const staffData = staffResponse?.items || [];

      setTimeframes(timeframesData || []);
      setSlotTypes(slotTypesData || []);
      setRooms(roomsData || []);
      setStaff(staffData || []);
      setStudentLevels(studentLevelsData || []);
    } catch (err) {
      console.error('Error fetching branch slot dependencies:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      // Clear slot types on error to avoid showing stale/all-branch data
      setSlotTypes([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Auto-fetch dependencies when branchId changes
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Transform data for easier use in forms
  const timeframeOptions = timeframes.map(timeframe => ({
    id: timeframe.id,
    name: timeframe.name,
    description: timeframe.description,
    startTime: timeframe.startTime,
    endTime: timeframe.endTime
  }));

  const slotTypeOptions = slotTypes.map(slotType => ({
    id: slotType.id,
    name: slotType.name,
    description: slotType.description
  }));

  const roomOptions = rooms.map(room => ({
    id: room.id,
    name: room.roomName || room.name,
    facilityName: room.facilityName || null
  }));

  const staffOptions = staff.map(user => ({
    id: user.id,
    name: user.fullName || user.name,
    email: user.email
  }));

  const studentLevelOptions = studentLevels.map(level => ({
    id: level.id,
    name: level.name,
    description: level.description
  }));

  return {
    // Raw data
    timeframes,
    slotTypes,
    rooms,
    staff,
    studentLevels,

    // Formatted options for dropdowns
    timeframeOptions,
    slotTypeOptions,
    roomOptions,
    staffOptions,
    studentLevelOptions,

    // State
    loading,
    error,

    // Helper functions
    getTimeframeById: (id) => timeframes.find(t => t.id === id),
    getSlotTypeById: (id) => slotTypes.find(st => st.id === id),
    getRoomById: (id) => rooms.find(r => r.id === id),
    getStaffById: (id) => staff.find(s => s.id === id),
    getStudentLevelById: (id) => studentLevels.find(sl => sl.id === id),

    // Fetch function - call this when you actually need the data
    fetchDependencies,
    // Refresh function - alias for fetchDependencies
    refresh: fetchDependencies
  };
};

export default useBranchSlotDependencies;

