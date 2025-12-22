import axiosInstance from '../config/axios.config';

const BRANCH_TRANSFER_BASE_PATH = '/Student/branch-transfer';

const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.append(key, value.toString());
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Parent endpoints
const createTransferRequest = async (requestData) => {
  try {
    const formData = new FormData();

    // Required fields
    if (requestData.studentId) {
      formData.append('StudentId', requestData.studentId);
    }
    if (requestData.targetBranchId) {
      formData.append('TargetBranchId', requestData.targetBranchId);
    }

    // Boolean fields - always include
    formData.append('ChangeSchool', requestData.changeSchool ? 'true' : 'false');
    formData.append('ChangeLevel', requestData.changeLevel ? 'true' : 'false');

    // Optional fields - only include if changing and have values
    if (requestData.changeSchool && requestData.targetSchoolId) {
      formData.append('TargetSchoolId', requestData.targetSchoolId);
    }

    if (requestData.changeLevel && requestData.targetStudentLevelId) {
      formData.append('TargetStudentLevelId', requestData.targetStudentLevelId);
    }

    // Document file - only if provided
    if (requestData.documentFile) {
      formData.append('DocumentFile', requestData.documentFile);
    }

    // Request reason - only if provided and not empty
    if (requestData.requestReason && requestData.requestReason.trim()) {
      formData.append('RequestReason', requestData.requestReason);
    }

    const response = await axiosInstance.post(`${BRANCH_TRANSFER_BASE_PATH}/request`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getMyTransferRequests = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/requests${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getMyTransferRequestById = async (requestId) => {
  try {
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const cancelTransferRequest = async (requestId) => {
  try {
    const response = await axiosInstance.delete(`${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Manager endpoints
const getAllTransferRequests = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/requests${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getTransferRequestById = async (requestId) => {
  try {
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getTransferRequestConflicts = async (requestId) => {
  try {
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}/conflicts`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const approveTransferRequest = async (requestId, approvalData) => {
  try {
    const response = await axiosInstance.post(
      `${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}/approve`,
      approvalData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const rejectTransferRequest = async (requestId, rejectionData) => {
  try {
    const response = await axiosInstance.post(
      `${BRANCH_TRANSFER_BASE_PATH}/requests/${requestId}/reject`,
      rejectionData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Document endpoints
const getTransferDocumentImageUrl = async (documentId) => {
  try {
    const response = await axiosInstance.get(`${BRANCH_TRANSFER_BASE_PATH}/documents/${documentId}/image`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const branchTransferService = {
  // Parent methods
  createTransferRequest,
  getMyTransferRequests,
  getMyTransferRequestById,
  cancelTransferRequest,

  // Manager methods
  getAllTransferRequests,
  getTransferRequestById,
  getTransferRequestConflicts,
  approveTransferRequest,
  rejectTransferRequest,

  // Document methods
  getTransferDocumentImageUrl
};

export default branchTransferService;
