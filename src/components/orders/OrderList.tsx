import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import axios from 'axios';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

interface PaginationInfo {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    offset: 0,
    limit: 10,
    hasMore: false
  });
  const navigate = useNavigate();

  const pageSizeOptions = [5, 10, 15, 20, 25, 30];

  const fetchOrders = async (offset = 0, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not authenticated (no user in localStorage)');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      if (!user?.id) {
        setError('User not authenticated (user object missing id)');
        setLoading(false);
        return;
      }
      setUserId(user.id);
      console.log('Fetching orders for user:', user.id, 'offset:', offset, 'limit:', limit);
      
      const endpoint = `/api/orders/user/${user.id}?offset=${offset}&limit=${limit}`;
      console.log('API endpoint:', endpoint);
      const response = await axios.get(endpoint);
      
      console.log('Received orders response:', response.data);
      
      // Handle both old format (array) and new format (object with orders and pagination)
      if (Array.isArray(response.data)) {
        // Old format - convert to new format
        setOrders(response.data);
        setPagination({
          total: response.data.length,
          offset: 0,
          limit: response.data.length,
          hasMore: false
        });
      } else if (response.data.orders && response.data.pagination) {
        // New format with pagination
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        // Fallback
        setOrders([]);
        setPagination({
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setLoading(false);
    }
  };

  useEffect(() => {
    const offset = (page - 1) * pageSize;
    fetchOrders(offset, pageSize);
  }, [page, pageSize]);

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (newOffset: number) => {
    fetchOrders(newOffset, pagination.limit);
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      const newOffset = pagination.offset + pagination.limit;
      handlePageChange(newOffset);
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      handlePageChange(newOffset);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Always render something
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading orders...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  console.log('Orders to render:', orders);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>
      {!Array.isArray(orders) ? (
        <Alert severity="error">Invalid orders data received</Alert>
      ) : orders.length === 0 ? (
        <Alert severity="info">No orders found</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => {
                // Ensure all required properties exist with defaults
                const computedItemsTotal = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                  : 0;
                const displayedTotal =
                  (order as any).totalAmount !== undefined && (order as any).totalAmount !== null && (order as any).totalAmount !== ''
                    ? Number((order as any).totalAmount)
                    : computedItemsTotal;

                const safeOrder = {
                  id: order.id || 'N/A',
                  status: order.status || 'unknown',
                  totalAmount: displayedTotal,
                  createdAt: order.createdAt || new Date().toISOString(),
                  items: Array.isArray(order.items) ? order.items : []
                };
                console.log('Processing order:', safeOrder);
                return (
                  <TableRow key={safeOrder.id}>
                    <TableCell>{safeOrder.id}</TableCell>
                    <TableCell>
                      {new Date(safeOrder.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={safeOrder.status}
                        color={getStatusColor(safeOrder.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {safeOrder.totalAmount.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => navigate(`/orders/${safeOrder.id}`)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dynamic Pagination Controls */}
      {pagination.total > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }} flexWrap="wrap" gap={2}>
          {/* Items per page selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Show:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                displayEmpty
                sx={{ height: 32 }}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              orders per page
            </Typography>
          </Box>

          {/* Results info */}
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(pagination.offset + 1, pagination.total)} - {Math.min(pagination.offset + pageSize, pagination.total)} of {pagination.total} orders
          </Typography>

          {/* Pagination */}
          {Math.ceil(pagination.total / pageSize) > 1 && (
            <Pagination
              count={Math.ceil(pagination.total / pageSize)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default OrderList; 