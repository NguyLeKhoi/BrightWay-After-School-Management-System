import axiosInstance from '../config/axios.config';

/**
 * User Service
 * Handles all user-related API calls
 */
const userService = {
  /**
   * Get all users
   * @returns {Promise} List of all users
   */
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get('/User');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get current logged-in user info
   * @returns {Promise} Current user details
   */
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/User/current-user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @param {boolean} expandRoleDetails - Whether to expand role-specific details (e.g. Family profile)
   * @returns {Promise} User details
   */
  getUserById: async (userId, expandRoleDetails = false) => {
    try {
      const params = new URLSearchParams();
      if (expandRoleDetails) {
        params.append('expandRoleDetails', 'true');
      }
      
      const url = `/User/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

   /**
    * Create new staff account
    * @param {Object} userData - User data { name, email, phoneNumber?, gender? }
    * @returns {Promise} Created staff user
    * @description Password will be set via email confirmation link sent to the user
    */
   createStaff: async (userData) => {
     try {
       // Backend expects { name, email, phoneNumber, gender } - password set via email confirmation
       const payload = {
         name: userData.fullName || userData.name,
         email: userData.email
       };
       
       // Add optional fields if provided
       if (userData.phoneNumber) {
         payload.phoneNumber = userData.phoneNumber;
       }
       if (userData.gender) {
         payload.gender = userData.gender;
       }
       
       const response = await axiosInstance.post('/User/staff', payload);
       return response.data;
     } catch (error) {
       throw error.response?.data || error.message;
     }
   },

   /**
    * Create new parent account (for Staff role only)
    * @param {FormData|Object} userData - User data as FormData (multipart/form-data) or Object { email, password, name, branchId }
    * @returns {Promise} Created parent user
    */
   createParent: async (userData) => {
     try {
       // If FormData, send directly (for multipart/form-data)
       if (userData instanceof FormData) {
         const response = await axiosInstance.post('/User/parent', userData, {
           headers: {
             'Content-Type': 'multipart/form-data'
           }
         });
         return response.data;
       }
       
       // Otherwise, create FormData from object
       const formData = new FormData();
       formData.append('Email', userData.email);
       formData.append('Name', userData.name || userData.fullName);
       if (userData.branchId) {
         formData.append('BranchId', userData.branchId);
       }
       
       const response = await axiosInstance.post('/User/parent', formData, {
         headers: {
           'Content-Type': 'multipart/form-data'
         }
       });
       return response.data;
     } catch (error) {
       throw error.response?.data || error.message;
     }
   },

   /**
    * Create new parent account with CCCD data (for Manager role)
    * @param {FormData|Object} userData - User data as FormData (multipart/form-data) or Object with CCCD information
    * @returns {Promise} Created parent user
    */
   createParentWithCCCD: async (userData) => {
     try {
       // If FormData, send directly (for multipart/form-data)
       if (userData instanceof FormData) {
         const response = await axiosInstance.post('/User/parent-with-cccd', userData, {
           headers: {
             'Content-Type': 'multipart/form-data'
           }
         });
         return response.data;
       }
       
       // Otherwise, create FormData from object
       const formData = new FormData();
       formData.append('Email', userData.email);
       formData.append('Name', userData.name || userData.fullName);
       
       if (userData.identityCardNumber) {
         formData.append('IdentityCardNumber', userData.identityCardNumber);
       }
       if (userData.dateOfBirth) {
         formData.append('DateOfBirth', userData.dateOfBirth);
       }
       if (userData.gender) {
         formData.append('Gender', userData.gender);
       }
       if (userData.address) {
         formData.append('Address', userData.address);
       }
       if (userData.issuedDate) {
         formData.append('IssuedDate', userData.issuedDate);
       }
       if (userData.issuedPlace) {
         formData.append('IssuedPlace', userData.issuedPlace);
       }
       if (userData.identityCardPublicId) {
         formData.append('IdentityCardPublicId', userData.identityCardPublicId);
       }
       
       const response = await axiosInstance.post('/User/parent-with-cccd', formData, {
         headers: {
           'Content-Type': 'multipart/form-data'
         }
       });
       return response.data;
     } catch (error) {
       throw error.response?.data || error.message;
     }
   },

   /**
    * Create new manager account
    * @param {Object} userData - User data { name, email, phoneNumber?, gender?, branchId? }
    * @returns {Promise} Created manager user
    * @description Password will be set via email confirmation link sent to the user
    */
   createManager: async (userData) => {
     try {
       // Backend expects { name, email, phoneNumber, gender, branchId } - password set via email confirmation
       const payload = {
         name: userData.name,
         email: userData.email
       };
       
       // Add optional fields if provided
       if (userData.phoneNumber) {
         payload.phoneNumber = userData.phoneNumber;
       }
       if (userData.gender) {
         payload.gender = userData.gender;
       }
       if (userData.branchId) {
         payload.branchId = userData.branchId;
       }
       
       const response = await axiosInstance.post('/User/manager', payload);
       return response.data;
     } catch (error) {
       throw error.response?.data || error.message;
     }
   },

   /**
    * Create new user (Admin creates account for user) - DEPRECATED: Use createStaff or createManager
    * @param {Object} userData - User data { fullName, email, phoneNumber, password }
    * @param {number} role - Role ID (0=Staff, 1=Manager)
    * @returns {Promise} Created user
    */
   createUser: async (userData, role) => {
     try {
       // Role must be sent as query parameter (0=Staff, 1=Manager only)
       const response = await axiosInstance.post('/User/admin-create', userData, {
         params: { role }
       });
       return response.data;
     } catch (error) {
       throw error.response?.data || error.message;
     }
   },

  /**
   * Create new user (Manager creates account for staff)
   * @param {Object} userData - User data { fullName, email, phoneNumber, password }
   * @returns {Promise} Created user
   */
  createUserByManager: async (userData) => {
    try {
      const response = await axiosInstance.post('/User/manager-create', userData, {
        params: { role: 0 }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update user (Admin updates Manager/Staff users)
   * @param {string} userId - User ID
   * @param {Object|FormData} userData - Updated user data { name, branchId } or FormData
   * @returns {Promise} Updated user
   */
  updateUser: async (userId, userData) => {
    try {
      // If FormData, send directly (for multipart/form-data)
      if (userData instanceof FormData) {
        const response = await axiosInstance.put(`/User/${userId}`, userData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      }
      
      // Otherwise, create FormData from object
      const formData = new FormData();
      
      // Name is required
      if (userData.name || userData.fullName) {
        formData.append('Name', userData.name || userData.fullName);
      }
      
      // BranchId is optional - append if provided (including empty string)
      if (userData.branchId !== undefined && userData.branchId !== null) {
        formData.append('BranchId', userData.branchId);
      }
      
      // IsActive is optional - only append if explicitly provided
      if (userData.isActive !== undefined) {
        formData.append('IsActive', userData.isActive.toString());
      }
      
      // AvatarFile is optional - only append if provided as File
      if (userData.avatarFile instanceof File) {
        formData.append('AvatarFile', userData.avatarFile);
      }
      
      const response = await axiosInstance.put(`/User/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete user (Admin soft deletes Manager/Staff users)
   * @param {string} userId - User ID
   * @returns {Promise} Deletion result
   */
  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update user (Manager updates Staff users)
   * @param {string} userId - User ID
   * @param {Object|FormData} userData - Updated user data { name, branchId } or FormData
   * @returns {Promise} Updated user
   */
  updateUserByManager: async (userId, userData) => {
    try {
      // If FormData, send directly (for multipart/form-data)
      if (userData instanceof FormData) {
        const response = await axiosInstance.put(`/User/${userId}`, userData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      }
      
      // Otherwise, create FormData from object
      const formData = new FormData();
      
      // Name is required
      if (userData.name || userData.fullName) {
        formData.append('Name', userData.name || userData.fullName);
      }
      
      // BranchId is optional - append if provided (including empty string)
      if (userData.branchId !== undefined && userData.branchId !== null) {
        formData.append('BranchId', userData.branchId);
      }
      
      // IsActive is optional - only append if explicitly provided
      if (userData.isActive !== undefined) {
        formData.append('IsActive', userData.isActive.toString());
      }
      
      // AvatarFile is optional - only append if provided as File
      if (userData.avatarFile instanceof File) {
        formData.append('AvatarFile', userData.avatarFile);
      }
      
      const response = await axiosInstance.put(`/User/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete user (Manager soft deletes Staff users)
   * @param {string} userId - User ID
   * @returns {Promise} Deletion result
   */
  deleteUserByManager: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get paginated users
   * @param {Object} params - Pagination parameters { page, pageSize, searchTerm }
   * @returns {Promise} Paginated user list
   */
  getUsersPaged: async (params = {}) => {
    try {
      const { pageIndex = 1, pageSize = 10, Keyword = '', Role = null, expandRoleDetails = false } = params;
      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });
      
      if (Keyword) {
        queryParams.append('Keyword', Keyword);
      }
      
      if (Role !== null && Role !== undefined) {
        queryParams.append('Role', Role.toString());
      }
      
      if (expandRoleDetails) {
        queryParams.append('expandRoleDetails', 'true');
      }
      
      const response = await axiosInstance.get(`/User/paged?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get paginated users filtered by role (with automatic keyword filtering by role)
   * @param {Object} params - Pagination parameters { pageIndex, pageSize, Keyword, Role }
   * @returns {Promise} Paginated user list filtered by role
   */
  getUsersPagedByRole: async (params = {}) => {
    try {
      const { pageIndex = 1, pageSize = 10, Keyword = '', Role = null, BranchId = '' } = params;
      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });
      
      if (Keyword) {
        queryParams.append('Keyword', Keyword);
      }
      
      if (Role !== null && Role !== undefined) {
        queryParams.append('Role', Role.toString());
      }

      if (BranchId) {
        queryParams.append('BranchId', BranchId);
      }
      
      const response = await axiosInstance.get(`/User/paged-by-role?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ===== PARENT/USER ACCOUNT METHODS =====
  // Note: createParent is defined above in STAFF ACCOUNT METHODS section

  // ===== FAMILY ACCOUNT METHODS (for Staff) =====

  /**
   * Create new family account (Staff creates User + Family + Parents)
   * @param {Object} familyData - Family account data
   * @returns {Promise} Created family account
   */
  createFamilyAccount: async (familyData) => {
    try {
      const response = await axiosInstance.post('/User/family-account', familyData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update family account
   * @param {string} id - Family account ID
   * @param {Object} familyData - Updated family account data
   * @returns {Promise} Updated family account
   */
  updateFamilyAccount: async (id, familyData) => {
    try {
      const response = await axiosInstance.put(`/User/family-account/${id}`, familyData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete family account
   * @param {string} id - Family account ID
   * @returns {Promise} Deletion result
   */
  deleteFamilyAccount: async (id) => {
    try {
      const response = await axiosInstance.delete(`/User/family-account/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get family account by ID
   * @param {string} id - Family account ID
   * @returns {Promise} Family account data
   */
  getFamilyAccountById: async (id) => {
    try {
      const response = await axiosInstance.get(`/User/family-account/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get paged family accounts
   * @param {Object} params - Query parameters
   * @returns {Promise} Paged family accounts
   */
  getFamilyAccountsPaged: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.PageNumber !== undefined) {
        queryParams.append('PageNumber', params.PageNumber.toString());
      }
      
      if (params.PageSize !== undefined) {
        queryParams.append('PageSize', params.PageSize.toString());
      }
      
      if (params.Keyword) {
        queryParams.append('Keyword', params.Keyword);
      }
      
      const response = await axiosInstance.get(`/User/family-accounts/paged?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get paginated staff in current manager's branch
   * @param {Object} params - Pagination parameters { pageIndex, pageSize, keyword }
   * @returns {Promise} Paginated staff list in manager's branch
   */
  getStaffInMyBranch: async (params = {}) => {
    try {
      const { pageIndex = 1, pageSize = 10, keyword = '' } = params;
      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });
      
      if (keyword) {
        queryParams.append('keyword', keyword);
      }
      
      const response = await axiosInstance.get(`/User/staff-in-my-branch?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update current user's profile (Name, PhoneNumber, Avatar)
   * @param {FormData|Object} profileData - Profile data as FormData (multipart/form-data) or Object { name, phoneNumber, avatarFile }
   * @returns {Promise} Updated user profile
   */
  updateMyProfile: async (profileData) => {
    try {
      // If FormData, send directly (for multipart/form-data)
      if (profileData instanceof FormData) {
        const response = await axiosInstance.put('/User/my-profile', profileData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      }
      
      // Otherwise, create FormData from object
      const formData = new FormData();
      if (profileData.name) {
        formData.append('Name', profileData.name);
      }
      if (profileData.phoneNumber) {
        formData.append('PhoneNumber', profileData.phoneNumber);
      }
      if (profileData.avatarFile instanceof File) {
        formData.append('AvatarFile', profileData.avatarFile);
      }
      
      const response = await axiosInstance.put('/User/my-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userService;
