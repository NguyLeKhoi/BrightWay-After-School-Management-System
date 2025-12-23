import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../contexts/AppContext';
import useContentLoading from './useContentLoading';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Base CRUD hook for all roles (Admin, Manager, Staff)
 * Handles common patterns: pagination, search, loading, error handling, CRUD operations
 * 
 * @param {Object} config - Configuration object
 * @param {Function} config.loadFunction - Function to load data (page, pageSize, filters)
 * @param {Function} config.createFunction - Function to create item
 * @param {Function} config.updateFunction - Function to update item
 * @param {Function} config.deleteFunction - Function to delete item
 * @param {Object} config.defaultFilters - Default filter values
 * @param {number} config.minLoadingDuration - Minimum loading duration (default: 300ms)
 * @param {boolean} config.loadOnMount - Whether to load data on mount (default: true)
 * @returns {Object} CRUD state and handlers
 */
const useBaseCRUD = ({
  loadFunction,
  createFunction,
  updateFunction,
  deleteFunction,
  defaultFilters = {},
  minLoadingDuration = 300,
  loadOnMount = true
}) => {
  // Data state
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // UI state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null
  });
  
  // Loading hook
  const { isLoading: isPageLoading, loadingText, showLoading, hideLoading } = useContentLoading(minLoadingDuration);
  const { showGlobalError } = useApp();
  
  // Memoize filters to prevent unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);
  const prevFiltersStringRef = useRef(filtersString);
  
  // Load data
  // By default we do not show loading indicator unless caller requests it.
  const loadData = useCallback(async (showLoadingIndicator = false) => {
    if (!loadFunction) return;
    
    if (showLoadingIndicator) {
      showLoading();
    }
    
    setError(null);
    
    try {
      const params = {
        pageIndex: page + 1,
        pageSize: rowsPerPage,
        ...filters
      };
      
      if (keyword.trim()) {
        params.searchTerm = keyword.trim();
        params.Keyword = keyword.trim();
      }
      
      const response = await loadFunction(params);
      
      // Handle both paginated and non-paginated responses
      // Backend may return Items/TotalCount (capital) or items/totalCount (lowercase)
      const items = response.items || response.Items;
      const totalCount = response.totalCount !== undefined 
        ? response.totalCount 
        : (response.TotalCount !== undefined ? response.TotalCount : undefined);
      
      if (items) {
        setData(Array.isArray(items) ? items : []);
        setTotalCount(totalCount !== undefined ? totalCount : (Array.isArray(items) ? items.length : 0));
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalCount(response.length);
      } else {
        setData([]);
        setTotalCount(0);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải dữ liệu';
      setError(errorMessage);
      showGlobalError(errorMessage);
      setData([]);
      setTotalCount(0);
    } finally {
      if (showLoadingIndicator) {
        hideLoading();
      }
    }
  }, [page, rowsPerPage, keyword, filtersString, loadFunction, showLoading, hideLoading, showGlobalError]);
  
  // Load data when page, rowsPerPage, or filters change
  // Show loading only on initial mount; subsequent changes trigger load without showing the overlay
  useEffect(() => {
    if (!loadOnMount) return;

    const mountedRef = prevFiltersStringRef.current === null ? { current: false } : { current: false };

    // We want to show loading only the first time this effect runs for this hook instance
    // Track with a local mounted flag
    let firstRun = true;

    const doLoad = async () => {
      if (firstRun) {
        firstRun = false;
        prevFiltersStringRef.current = filtersString;
        await loadData(true);
      } else {
        prevFiltersStringRef.current = filtersString;
        await loadData(false);
      }
    };

    doLoad();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filtersString]); // Removed loadData from dependencies to prevent infinite loop
  
  // Debounced search
  useEffect(() => {
    if (!loadOnMount) return;
    
    const debounceTimer = setTimeout(() => {
      loadData(false);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);
  
  // Create handler
  const handleCreate = useCallback(() => {
    setDialogMode('create');
    setSelectedItem(null);
    setOpenDialog(true);
  }, []);
  
  // Edit handler
  const handleEdit = useCallback((item) => {
    setDialogMode('edit');
    setSelectedItem(item);
    setOpenDialog(true);
  }, []);
  
  // Delete handler
  const handleDelete = useCallback((item, itemName = 'mục này') => {
    const displayName = item.name || item.fullName || item.facilityName || item.branchName || item.roomName || itemName;
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa',
      description: `Bạn có chắc chắn muốn xóa "${displayName}"? Hành động này không thể hoàn tác.`,
      onConfirm: () => performDelete(item.id)
    });
  }, []);
  
  // Perform delete
  const performDelete = useCallback(async (itemId) => {
    if (!deleteFunction) return;
    
    setConfirmDialog(prev => ({ ...prev, open: false }));
    setActionLoading(true);
    
    try {
      await deleteFunction(itemId);
      
      toast.success('Xóa thành công!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // If we're deleting the last item on current page and not on first page, go to previous page
      if (data.length === 1 && page > 0) {
        setPage(page - 1);
      }
      
      await loadData(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa';
      setError(errorMessage);
      showGlobalError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setActionLoading(false);
    }
  }, [deleteFunction, data.length, page, loadData, showGlobalError]);
  
  // Form submit handler
  const handleFormSubmit = useCallback(async (formData) => {
    setActionLoading(true);
    
    try {
      if (dialogMode === 'create' && createFunction) {
        await createFunction(formData);
        toast.success('Tạo thành công!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (dialogMode === 'edit' && updateFunction && selectedItem) {
        await updateFunction(selectedItem.id, formData);
        toast.success('Cập nhật thành công!', {
          position: "top-right",
          autoClose: 3000,
        });
      }
      
      setOpenDialog(false);
      await loadData(false);
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 
        (dialogMode === 'create' ? 'Có lỗi xảy ra khi tạo' : 'Có lỗi xảy ra khi cập nhật');
      setError(errorMessage);
      showGlobalError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    } finally {
      setActionLoading(false);
    }
  }, [dialogMode, createFunction, updateFunction, selectedItem, loadData, showGlobalError]);
  
  // Search handlers
  const handleKeywordSearch = useCallback(() => {
    setPage(0);
    loadData();
  }, [loadData]);
  
  const handleKeywordChange = useCallback((e) => {
    setKeyword(e.target.value);
    setPage(0);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setKeyword('');
    setFilters(defaultFilters);
    setPage(0);
  }, [defaultFilters]);
  
  // Pagination handlers
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);
  
  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);
  
  // Filter handlers
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);
  
  return {
    // Data
    data,
    totalCount,
    
    // UI State
    page,
    rowsPerPage,
    keyword,
    filters,
    error,
    actionLoading,
    isPageLoading,
    loadingText,
    
    // Dialog State
    openDialog,
    setOpenDialog,
    dialogMode,
    selectedItem,
    
    // Confirm Dialog
    confirmDialog,
    setConfirmDialog,
    
    // Actions
    loadData,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit,
    
    // Search
    handleKeywordSearch,
    handleKeywordChange,
    handleClearSearch,
    
    // Pagination
    handlePageChange,
    handleRowsPerPageChange,
    
    // Filters
    updateFilter,
    setFilters,
    setPage,
    setRowsPerPage,
    setError
  };
};

export default useBaseCRUD;

