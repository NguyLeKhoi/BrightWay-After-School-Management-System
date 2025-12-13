import axiosInstance from '../config/axios.config';

const STUDENT_BASE_PATH = '/Student';
const DEFAULT_PAGE_SIZE = 50;

const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.append(key, value.toString());
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

const getStudentsPaged = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/paged${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getAllStudents = async () => {
  try {
    let pageIndex = 1;
    let hasMore = true;
    const aggregatedStudents = [];

    while (hasMore) {
      const result = await getStudentsPaged({
        pageIndex,
        pageSize: DEFAULT_PAGE_SIZE
      });

      const items = result?.items ?? [];
      aggregatedStudents.push(...items);

      const totalCount = result?.totalCount ?? items.length;
      hasMore =
        aggregatedStudents.length < totalCount &&
        items.length === DEFAULT_PAGE_SIZE;
      pageIndex += 1;

      if (items.length === 0) {
        hasMore = false;
      }
    }

    return aggregatedStudents;
  } catch (error) {
    throw error;
  }
};

const getCurrentUserStudents = async (params = {}) => {
  const { pageIndex = 1, pageSize = 10 } = params;
  const query = buildQueryString({ pageIndex, pageSize });

  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/paged/current-user${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getStudentById = async (studentId) => {
  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const createStudent = async (studentData) => {
  try {
    const response = await axiosInstance.post(STUDENT_BASE_PATH, studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const updateStudent = async (studentId, studentData) => {
  try {
    const response = await axiosInstance.put(`${STUDENT_BASE_PATH}/${studentId}`, studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get current logged in user's children (all)
 * @returns {Promise} List of all children for current user
 */
const getMyChildren = async () => {
  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/my-children`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get current logged in user's children (paged)
 * @param {Object} params - Pagination parameters { pageIndex, pageSize }
 * @returns {Promise} Paginated list of children for current user
 */
const getMyChildrenPaged = async (params = {}) => {
  try {
    const { pageIndex = 1, pageSize = 10 } = params;
    const queryString = buildQueryString({ pageIndex, pageSize });
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/my-children/paged${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get a specific child of current logged in user by studentId
 * @param {string} studentId - Student ID
 * @returns {Promise} Child information
 */
const getMyChildById = async (studentId) => {
  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/my-children/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get unverified students (students that haven't been approved yet)
 * @returns {Promise} List of unverified students
 */
const getUnverifiedStudents = async () => {
  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/unverified-students`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Register a child for the current logged in parent
 * @param {FormData} formData - Form data with student info and document file
 * @returns {Promise} Registered student
 */
const registerChild = async (formData) => {
  try {
    const response = await axiosInstance.post(`${STUDENT_BASE_PATH}/register-child`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Add a document for a student
 * @param {string} studentId - Student ID
 * @param {FormData} formData - Form data with document info and file
 * @returns {Promise} Added document
 */
const addDocument = async (studentId, formData) => {
  try {
    const response = await axiosInstance.post(`${STUDENT_BASE_PATH}/${studentId}/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Approve a student after validating all documents
 * @param {string} studentId - Student ID
 * @returns {Promise} Approval result
 */
const approveStudent = async (studentId) => {
  try {
    const response = await axiosInstance.post(`${STUDENT_BASE_PATH}/${studentId}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Approve or reject a student's document
 * @param {string} documentId - Document ID
 * @param {boolean} approve - true to approve, false to reject
 * @returns {Promise} Updated document
 */
const approveDocument = async (documentId, approve = true) => {
  try {
    const response = await axiosInstance.post(
      `${STUDENT_BASE_PATH}/documents/${documentId}/approve?approve=${approve}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get a signed URL to view a student's document image
 * @param {string} documentId - Document ID
 * @returns {Promise<{imageUrl: string, expiresInMinutes?: number, message?: string}>}
 */
const getDocumentImageUrl = async (documentId) => {
  try {
    const response = await axiosInstance.get(`${STUDENT_BASE_PATH}/documents/${documentId}/image`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update student basic information by parent (name, dateOfBirth, note, imageFile)
 * @param {string} studentId - Student ID
 * @param {FormData|Object} studentData - Student data { name, dateOfBirth, note, imageFile }
 * @returns {Promise} Updated student
 */
const parentUpdateStudent = async (studentId, studentData) => {
  try {
    let formData;
    
    // If FormData, send directly (for multipart/form-data)
    if (studentData instanceof FormData) {
      formData = studentData;
    } else {
      // Otherwise, create FormData from object
      formData = new FormData();
      
      // Name is required
      if (studentData.name) {
        formData.append('Name', studentData.name);
      }
      
      // DateOfBirth is required
      if (studentData.dateOfBirth) {
        formData.append('DateOfBirth', studentData.dateOfBirth);
      }
      
      // Note is optional - append if provided (including empty string)
      if (studentData.note !== undefined && studentData.note !== null) {
        formData.append('Note', studentData.note || '');
      }
      
      // ImageFile is optional - only append if provided as File
      if (studentData.imageFile instanceof File) {
        formData.append('ImageFile', studentData.imageFile);
      }
    }

    const response = await axiosInstance.put(
      `${STUDENT_BASE_PATH}/${studentId}/parent-update`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Soft delete a student
 * @param {string} studentId - Student ID
 * @returns {Promise} Deletion result
 */
const deleteStudent = async (studentId) => {
  try {
    const response = await axiosInstance.delete(`${STUDENT_BASE_PATH}/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const studentService = {
  getAllStudents,
  getStudentsPaged,
  getCurrentUserStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getMyChildren,
  getMyChildrenPaged,
  getMyChildById,
  registerChild,
  addDocument,
  getUnverifiedStudents,
  approveStudent,
  approveDocument,
  getDocumentImageUrl,
  parentUpdateStudent,
  deleteStudent
};

export default studentService;

