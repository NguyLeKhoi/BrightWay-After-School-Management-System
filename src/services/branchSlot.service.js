import axiosInstance from '../config/axios.config';
import { formatDateToUTC7ISO, extractDateString } from '../utils/dateHelper';

/**
 * Branch Slot Service
 * Handles all branch slot-related API calls
 */
const branchSlotService = {
  /**
   * Get paginated branch slots for current manager's branch
   */
  getMyBranchSlotsPaged: async (params = {}) => {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        status = null,
        weekDate = null,
        timeframeId = null,
        slotTypeId = null,
        date = null
      } = params;

      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });

      if (status !== null && status !== undefined && status !== '') {
        queryParams.append('status', status.toString());
      }

      if (weekDate !== null && weekDate !== undefined && weekDate !== '') {
        queryParams.append('weekDate', weekDate.toString());
      }

      if (timeframeId !== null && timeframeId !== undefined && timeframeId !== '') {
        queryParams.append('timeframeId', timeframeId.toString());
      }

      if (slotTypeId !== null && slotTypeId !== undefined && slotTypeId !== '') {
        queryParams.append('slotTypeId', slotTypeId.toString());
      }

      // Add date parameter if provided
      if (date) {
        // Convert date to YYYY-MM-DD format for query params
        const dateStr = date instanceof Date 
          ? date.toISOString().split('T')[0] 
          : typeof date === 'string' 
            ? date.split('T')[0] 
            : date;
        if (dateStr) {
          queryParams.append('date', dateStr);
        }
      }

      const response = await axiosInstance.get(`/BranchSlot/manager/paged?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get available slots for a student (user side)
   * @param {string} studentId - Student ID
   * @param {Object} params - Query parameters
   * @param {number} params.pageIndex - Page index (default: 1)
   * @param {number} params.pageSize - Page size (default: 10)
   * @param {Date|string} params.date - Single date filter (YYYY-MM-DD format, takes priority if provided)
   * @param {Date|string} params.startDate - Start of date range (YYYY-MM-DD format)
   * @param {Date|string} params.endDate - End of date range (YYYY-MM-DD format)
   * @param {string} params.timeframeId - Filter by timeframe ID
   * @param {string} params.slotTypeId - Filter by slot type ID
   * @param {number} params.weekDate - Filter by weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
   * @returns {Promise} Paginated list of available slots
   */
  getAvailableSlotsForStudent: async (studentId, params = {}) => {
    try {
      const { 
        pageIndex = 1, 
        pageSize = 10, 
        date = null,
        startDate = null,
        endDate = null,
        timeframeId = null,
        slotTypeId = null,
        weekDate = null
      } = params;
      const query = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });
      
      // Helper function to format date to YYYY-MM-DD
      const formatDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) {
          return extractDateString(dateValue);
        } else if (typeof dateValue === 'string') {
          const dateStr = extractDateString(dateValue);
          return dateStr || dateValue;
        }
        return dateValue;
      };
      
      // Add date parameter if provided (takes priority)
      if (date) {
        const dateStr = formatDate(date);
        if (dateStr) {
          query.append('date', dateStr);
        }
      } else {
        // Add date range parameters if date is not provided
        if (startDate) {
          const startDateStr = formatDate(startDate);
          if (startDateStr) {
            query.append('startDate', startDateStr);
          }
        }
        
        if (endDate) {
          const endDateStr = formatDate(endDate);
          if (endDateStr) {
            query.append('endDate', endDateStr);
          }
        }
      }
      
      // Add other optional filters
      if (timeframeId !== null && timeframeId !== undefined && timeframeId !== '') {
        query.append('timeframeId', timeframeId.toString());
      }
      
      if (slotTypeId !== null && slotTypeId !== undefined && slotTypeId !== '') {
        query.append('slotTypeId', slotTypeId.toString());
      }
      
      if (weekDate !== null && weekDate !== undefined && weekDate !== '') {
        query.append('weekDate', weekDate.toString());
      }
      
      const response = await axiosInstance.get(
        `/BranchSlot/available-for-student/${studentId}?${query.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Load all available slots for a student (handles pagination automatically)
   * @param {string} studentId - Student ID
   * @param {Object} params - Parameters including date, pageSize (optional, default 100)
   * @returns {Promise<Array>} Array of all available slots across all pages
   */
  getAllAvailableSlotsForStudent: async function(studentId, params = {}) {
    const allSlots = [];
    let pageIndex = 1;
    const pageSize = params.pageSize || 100;
    let hasMore = true;
    let totalCount = 0;
    let totalPages = 0;

    while (hasMore) {
      const response = await this.getAvailableSlotsForStudent(studentId, {
        ...params,
        pageIndex: pageIndex,
        pageSize: pageSize
      });

      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : [];
      
      if (pageIndex === 1) {
        totalCount = response?.totalCount || 0;
        totalPages = response?.totalPages;
        
        if (!totalPages && totalCount > 0) {
          totalPages = Math.ceil(totalCount / pageSize);
        }
      }

      if (items.length > 0) {
        allSlots.push(...items);
      }

      if (totalPages > 0) {
        if (pageIndex >= totalPages) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      } else {
        if (items.length < pageSize) {
          hasMore = false;
        } else {
          pageIndex++;
        }
      }
    }

    return allSlots;
  },

  /**
   * Get branch slot by ID
   * @param {string} branchSlotId - Branch slot ID
   * @returns {Promise} Branch slot details
   */
  getBranchSlotById: async (branchSlotId) => {
    try {
      const response = await axiosInstance.get(`/BranchSlot/${branchSlotId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new branch slot for current manager's branch
   * @param {Object} branchSlotData - Branch slot data { timeframeId, slotTypeId, weekDate, status }
   * @returns {Promise} Created branch slot
   */
  createMyBranchSlot: async (branchSlotData) => {
    try {
      const response = await axiosInstance.post('/BranchSlot/manager/create', branchSlotData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing branch slot
   * @param {string} branchSlotId - Branch slot ID
   * @param {Object} branchSlotData - Updated branch slot data
   * @returns {Promise} Updated branch slot
   */
  updateBranchSlot: async (branchSlotId, branchSlotData) => {
    try {
      console.log('updateBranchSlot API call:', {
        url: `/BranchSlot/${branchSlotId}`,
        method: 'PUT',
        data: branchSlotData
      });
      const response = await axiosInstance.put(`/BranchSlot/${branchSlotId}`, branchSlotData);
      console.log('updateBranchSlot API response:', {
        status: response.status,
        data: response.data,
        slotTypeId: response.data?.slotTypeId,
        timeframeId: response.data?.timeframeId
      });
      return response.data;
    } catch (error) {
      console.error('updateBranchSlot API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || error.message;
    }
  },

  /**
   * Soft delete a branch slot
   * @param {string} branchSlotId - Branch slot ID
   * @returns {Promise} Deletion result
   */
  deleteBranchSlot: async (branchSlotId) => {
    try {
      const response = await axiosInstance.delete(`/BranchSlot/${branchSlotId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Assign a staff user to a specific branch slot
   * @param {Object} assignmentData - Assignment data { branchSlotId, userId, roomId, name }
   * @returns {Promise} Assignment result
   */
  assignStaff: async (assignmentData) => {
    try {
      const response = await axiosInstance.post('/BranchSlot/assign-staff', assignmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Assign rooms to a branch slot
   * @param {Object} assignmentData - Assignment data { branchSlotId, roomIds: [] }
   * @returns {Promise} Assignment result
   */
  assignRooms: async (assignmentData) => {
    try {
      console.log('assignRooms API call:', { 
        url: '/BranchSlot/assign-rooms', 
        data: assignmentData,
        branchSlotId: assignmentData.branchSlotId,
        roomIdsCount: assignmentData.roomIds?.length || 0
      });
      const response = await axiosInstance.post('/BranchSlot/assign-rooms', assignmentData);
      console.log('assignRooms API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('assignRooms API error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get rooms by branch slot ID (optionally paginated)
   */
  getRoomsByBranchSlot: async (branchSlotId, params = {}) => {
    try {
      const { pageIndex = 1, pageSize = 1000 } = params;
      let url = `/BranchSlot/${branchSlotId}/rooms`;
      if (pageIndex !== undefined && pageSize !== undefined) {
        const query = new URLSearchParams({
          pageIndex: pageIndex.toString(),
          pageSize: pageSize.toString()
        });
        url = `${url}?${query.toString()}`;
      }
      console.log('getRoomsByBranchSlot API call:', { url, branchSlotId, pageIndex, pageSize });
      const response = await axiosInstance.get(url);
      console.log('getRoomsByBranchSlot API response:', { 
        branchSlotId, 
        items: response.data?.items?.length || 0,
        totalCount: response.data?.totalCount || 0,
        data: response.data
      });
      return response.data;
    } catch (error) {
      console.error('getRoomsByBranchSlot API error:', { branchSlotId, error: error.response?.data || error.message });
      throw error.response?.data || error.message;
    }
  },

  /**
   * Unassign a staff from a specific branch slot
   * @param {string} branchSlotId - Branch slot ID
   * @param {string} staffId - Staff ID (userId)
   * @returns {Promise} Unassignment result
   */
  unassignStaff: async (branchSlotId, staffId) => {
    try {
      const response = await axiosInstance.delete(`/BranchSlot/${branchSlotId}/staff/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Unassign a room from a specific branch slot
   * @param {string} branchSlotId - Branch slot ID
   * @param {string} roomId - Room ID
   * @returns {Promise} Unassignment result
   */
  unassignRoom: async (branchSlotId, roomId) => {
    try {
      const response = await axiosInstance.delete(`/BranchSlot/${branchSlotId}/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Duplicate a branch slot with its rooms and staff assignments for multiple dates
   * @param {string} sourceSlotId - Source branch slot ID to duplicate
   * @param {Array<string>} newDates - Array of date strings (ISO format) for new slots. If empty, creates one duplicate with source slot's date
   * @returns {Promise} Duplication result
   */
  duplicateBranchSlot: async (sourceSlotId, newDates = []) => {
    try {
      console.log('duplicateBranchSlot API call:', {
        url: `/BranchSlot/${sourceSlotId}/duplicate`,
        method: 'POST',
        data: newDates
      });
      const response = await axiosInstance.post(`/BranchSlot/${sourceSlotId}/duplicate`, newDates);
      console.log('duplicateBranchSlot API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('duplicateBranchSlot API error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Bulk create branch slots across a date range with multiple weekdays
   * @param {Object} bulkData - Bulk creation data
   * Backend expects: { dto: { timeframeId, slotTypeId, startDate, endDate, status, roomAssignments }, weekDates: number[] }
   * This method accepts both the backend shape above and legacy shapes used in older UI code.
   * @returns {Promise} Bulk creation result
   */
  bulkCreateBranchSlots: async (bulkData) => {
    try {
      const formatLocalDateToUTC7Noon = (dateValue) => {
        if (!dateValue) return null;
        let dateObj;
        if (dateValue instanceof Date) {
          dateObj = dateValue;
        } else if (typeof dateValue === 'string') {
          const dateStr = dateValue.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else {
          dateObj = new Date(dateValue);
        }
        if (isNaN(dateObj.getTime())) return null;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T12:00:00.000+07:00`;
      };

      const normalizeWeekDatesToInts = (values) => {
        if (!Array.isArray(values)) return [];
        // If already numbers (0-6), keep them
        if (values.every((v) => typeof v === 'number' && !Number.isNaN(v))) {
          return values;
        }
        // If numeric strings
        if (values.every((v) => typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))) {
          return values.map((v) => Number(v));
        }
        // Legacy: ISO date strings -> map to weekday ints, unique
        const weekdays = new Set();
        values.forEach((v) => {
          const d = new Date(v);
          if (!isNaN(d.getTime())) {
            weekdays.add(d.getDay());
          }
        });
        return Array.from(weekdays);
      };

      const normalizeRequest = (input) => {
        if (!input || typeof input !== 'object') {
          return { dto: {}, weekDates: [] };
        }
        // Already in backend shape
        if (input.dto && input.weekDates) {
          const normalizedWeekDates = normalizeWeekDatesToInts(input.weekDates);
          const dto = input.dto || {};
          // Also include flat fields for compatibility
          return {
            dto,
            weekDates: normalizedWeekDates,
            ...dto,
            weekDatesFlat: undefined
          };
        }

        // Legacy shape: { timeframeId, slotTypeId, weekDates: [dateStrings], roomAssignments }
        // Try to derive start/end from provided date list
        if (Array.isArray(input.weekDates) && (input.timeframeId || input.slotTypeId)) {
          const parsedDates = input.weekDates
            .map((v) => new Date(v))
            .filter((d) => !isNaN(d.getTime()));
          parsedDates.sort((a, b) => a.getTime() - b.getTime());
          const startDate = parsedDates[0] ? formatLocalDateToUTC7Noon(parsedDates[0]) : null;
          const endDate = parsedDates[parsedDates.length - 1]
            ? formatLocalDateToUTC7Noon(parsedDates[parsedDates.length - 1])
            : null;

          const dto = {
            dto: {
              timeframeId: input.timeframeId,
              slotTypeId: input.slotTypeId,
              startDate,
              endDate,
              status: input.status || 'Available',
              roomAssignments: input.roomAssignments || []
            }
          };
          const normalizedWeekDates = normalizeWeekDatesToInts(input.weekDates);
          return {
            ...dto,
            weekDates: normalizedWeekDates,
            ...dto.dto
          };
        }

        // Another legacy shape: { timeframeId, slotTypeId, startDate, endDate, selectedWeekDays }
        if (input.selectedWeekDays && (input.startDate || input.endDate)) {
          const dto = {
            timeframeId: input.timeframeId,
            slotTypeId: input.slotTypeId,
            startDate: formatLocalDateToUTC7Noon(input.startDate),
            endDate: formatLocalDateToUTC7Noon(input.endDate),
            status: input.status || 'Available',
            roomAssignments: input.roomAssignments || []
          };
          return {
            dto,
            weekDates: normalizeWeekDatesToInts(input.selectedWeekDays),
            ...dto
          };
        }

        const dto = input.dto || {};
        const normalizedWeekDates = normalizeWeekDatesToInts(input.weekDates);
        return { dto, weekDates: normalizedWeekDates, ...dto };
      };

      const requestBody = normalizeRequest(bulkData);

      // Remove accidental helper keys if any
      if (requestBody.weekDatesFlat !== undefined) {
        delete requestBody.weekDatesFlat;
      }
      console.log('bulkCreateBranchSlots API call:', {
        url: '/BranchSlot/manager/bulk-create',
        method: 'POST',
        data: requestBody
      });
      const response = await axiosInstance.post('/BranchSlot/manager/bulk-create', requestBody);
      console.log('bulkCreateBranchSlots API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('bulkCreateBranchSlots API error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Change the room assigned to a branch slot. Moves all students and staff from old room to new room
   * @param {string} branchSlotId - Branch slot ID
   * @param {string} oldRoomId - Old room ID
   * @param {string} newRoomId - New room ID
   * @returns {Promise} Change room result
   */
  changeRoom: async (branchSlotId, oldRoomId, newRoomId) => {
    try {
      console.log('changeRoom API call:', {
        url: `/BranchSlot/${branchSlotId}/change-room`,
        method: 'PUT',
        data: { oldRoomId, newRoomId }
      });
      const response = await axiosInstance.put(`/BranchSlot/${branchSlotId}/change-room`, {
        oldRoomId,
        newRoomId
      });
      console.log('changeRoom API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('changeRoom API error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  }
};

export default branchSlotService;

