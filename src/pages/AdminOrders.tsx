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
  MenuItem,
  Select,
  Button
} from '@mui/material';
import axios from 'axios';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    name?: string;
  }>;
}

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<{ [orderId: string]: string }>({});

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/orders/admin/my-products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const handleUpdateStatus = async (orderId: string) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('token');
      const status = statusUpdates[orderId];
      await axios.patch(`/api/orders/${orderId}/status/owner`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders((prev) => prev.map(order => order.id === orderId ? { ...order, status } : order));
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdating(null);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Orders for My Products
      </Typography>
      {orders.length === 0 ? (
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
                <TableCell>Update Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {order.total_amount.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={statusUpdates[order.id] || order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as string)}
                      size="small"
                      sx={{ minWidth: 120, mr: 1 }}
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={updating === order.id || (statusUpdates[order.id] || order.status) === order.status}
                      onClick={() => handleUpdateStatus(order.id)}
                    >
                      {updating === order.id ? 'Updating...' : 'Update'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminOrders; 