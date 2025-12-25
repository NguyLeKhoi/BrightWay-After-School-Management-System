import axiosInstance from '../config/axios.config';

const AdminService = {
  getSlotCancellation: async () => {
    const res = await axiosInstance.get('/Admin/slot-cancellation-deadline');
    return res.data;
  },

  getPackageRefundSettings: async () => {
    const res = await axiosInstance.get('/Admin/package-refund-settings');
    return res.data;
  },

  getPackageRenewalSettings: async () => {
    const res = await axiosInstance.get('/Admin/package-renewal-settings');
    return res.data;
  },

  getPackageUpgradeSettings: async () => {
    const res = await axiosInstance.get('/Admin/package-upgrade-settings');
    return res.data;
  },

  updateSlotCancellation: async (payload) => {
    return axiosInstance.put('/Admin/slot-cancellation-deadline', payload);
  },

  updatePackageRefundSettings: async (payload) => {
    return axiosInstance.put('/Admin/package-refund-settings', payload);
  },

  updatePackageRenewalSettings: async (payload) => {
    return axiosInstance.put('/Admin/package-renewal-settings', payload);
  }
  ,
  updatePackageUpgradeSettings: async (payload) => {
    return axiosInstance.put('/Admin/package-upgrade-settings', payload);
  }
};

export default AdminService;
