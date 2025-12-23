import React, { memo, useCallback, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  MeetingRoomOutlined as RoomIcon,
  PersonAdd as StaffIcon,
  Inventory as PackageIcon
  ,
  Business as BranchIcon
} from '@mui/icons-material';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete,
  onAssignRooms,
  onAssignStaff,
  onAssignPackages,
  onAssignBranches,
  onUnassignBranches,
  emptyMessage = "Không có dữ liệu",
  showActions = true,
  expandableConfig = null,
  getRowClassName = null,
  getRowSx = null
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  const isRowExpandable = expandableConfig?.isRowExpandable;
  const renderExpandedContent = expandableConfig?.renderExpandedContent;

  const toggleRow = useCallback((rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  }, []);

  const hasAnyAction = Boolean(onView || onEdit || onDelete || onAssignRooms || onAssignStaff || onAssignPackages);

  // Action Menu Component for each row
  const ActionMenu = ({ item }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleMenuAction = (action) => {
      handleClose();
      if (action) {
        action(item);
      }
    };

    return (
      <>
        <Tooltip title="Thao tác">
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={(e) => e.stopPropagation()}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {onView && (
            <MenuItem onClick={() => handleMenuAction(onView)}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText>Xem chi tiết</ListItemText>
            </MenuItem>
          )}
          {onEdit && (
            <MenuItem onClick={() => handleMenuAction(onEdit)}>
              <ListItemIcon>
                <EditIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Sửa</ListItemText>
            </MenuItem>
          )}
          {onAssignRooms && (
            <MenuItem onClick={() => handleMenuAction(onAssignRooms)}>
              <ListItemIcon>
                <RoomIcon fontSize="small" color="secondary" />
              </ListItemIcon>
              <ListItemText>Gán phòng</ListItemText>
            </MenuItem>
          )}
          {onAssignBranches && (
            <MenuItem onClick={() => handleMenuAction(onAssignBranches)}>
              <ListItemIcon>
                <BranchIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Gán chi nhánh</ListItemText>
            </MenuItem>
          )}
          {onUnassignBranches && (
            <MenuItem onClick={() => handleMenuAction(onUnassignBranches)}>
              <ListItemIcon>
                <BranchIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Hủy gán chi nhánh</ListItemText>
            </MenuItem>
          )}
          {onAssignStaff && (
            <MenuItem onClick={() => handleMenuAction(onAssignStaff)}>
              <ListItemIcon>
                <StaffIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Gán nhân viên</ListItemText>
            </MenuItem>
          )}
          {onAssignPackages && (
            <MenuItem onClick={() => handleMenuAction(onAssignPackages)}>
              <ListItemIcon>
                <PackageIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Gán gói</ListItemText>
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem 
              onClick={() => handleMenuAction(onDelete)}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.dark'
                }
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Xóa</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflowX: 'auto' }}>
      <TableContainer sx={{ minWidth: 650 }}>
        <Table sx={{ tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              {expandableConfig && (
                <TableCell padding="checkbox" />
              )}
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.header}
                </TableCell>
              ))}
              {showActions && (
                <TableCell align="center">Thao tác</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => {
              const rowId = item.id || index;
              const expandable = Boolean(
                expandableConfig && (!isRowExpandable || isRowExpandable(item))
              );
              const isExpanded = expandedRows[rowId] || false;

              const rowClassName = getRowClassName ? getRowClassName(item, index) : '';
              const rowSx = getRowSx ? getRowSx(item, index) : {};

              return (
                <React.Fragment key={rowId}>
                  <TableRow hover className={rowClassName} sx={rowSx}>
                    {expandable && (
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(rowId)}
                          aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    )}
                    {!expandable && expandableConfig && <TableCell padding="checkbox" />}
                    {columns.map((column) => (
                      <TableCell key={column.key} align={column.align || 'left'}>
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </TableCell>
                    ))}
                    {showActions && hasAnyAction && (
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          <ActionMenu item={item} />
                        </Box>
                      </TableCell>
                    )}
                    {showActions && !hasAnyAction && (
                      <TableCell align="center" />
                    )}
                  </TableRow>
                  {expandable && isExpanded && renderExpandedContent && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (showActions ? 1 : 0) + 1}
                        sx={{ backgroundColor: 'var(--bg-secondary)', p: 2 }}
                      >
                        {renderExpandedContent(item)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Số dòng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
        }
      />
    </Paper>
  );
};

// Memoize DataTable to prevent unnecessary re-renders when parent re-renders
export default memo(DataTable);
