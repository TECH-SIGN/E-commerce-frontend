import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number | string;
  name?: string | null;
  image?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount?: number | string;
  createdAt: string;
  items: OrderItem[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  const d = dayjs(dateString);
  if (!d.isValid()) return 'Invalid Date';
  return d.format('DD MMMM YYYY, hh:mm A');
};

const formatCurrency = (amount: number | string) => {
  return amount !== undefined
    ? amount === ''
      ? ''
      : Number(amount).toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        })
    : '';
};

// Utility to convert snake_case to camelCase
function toCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Recursively normalize object keys from snake_case to camelCase
function normalizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key);
        newObj[camelKey] = normalizeKeys(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/${id}`);
        let normalizedOrder = normalizeKeys(response.data);
        // Enrich items with missing name/image
        const items = normalizedOrder.items || [];
        const API_URL = process.env.REACT_APP_API_URL || '';
        const itemsToFetch = items
          .map((item: OrderItem, idx: number) => ({ ...item, idx }))
          .filter((item: OrderItem & { idx: number }) => !item.name || item.name === 'null');
        if (itemsToFetch.length > 0) {
          const fetched = await Promise.all(
            itemsToFetch.map(async (item: OrderItem & { idx: number }) => {
              try {
                const { data } = await axios.get(`${API_URL}/api/products/${item.productId}`);
                return {
                  idx: item.idx,
                  name: data.name || 'Unknown Product',
                  image: data.images && data.images.length > 0 ? `${API_URL}${data.images[0]}` : undefined,
                };
              } catch {
                return {
                  idx: item.idx,
                  name: 'Unknown Product',
                  image: undefined,
                };
              }
            })
          );
          // Merge fetched data into items immutably
          const enrichedItems = items.map((item: OrderItem, idx: number) => {
            const found = fetched.find(f => f.idx === idx);
            return found ? { ...item, name: found.name, image: found.image } : item;
          });
          normalizedOrder = { ...normalizedOrder, items: enrichedItems };
        }
        setOrder(normalizedOrder);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch order details');
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

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

  // Calculate total from items
  const getActualTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box mt={2}>
        <Alert severity="error">{error || 'Order not found'}</Alert>
      </Box>
    );
  }

  // Trust backend totalAmount if provided; fallback to summing items
  const fallbackTotal = getActualTotal(order.items);
  const displayedTotal =
    order.totalAmount !== undefined && order.totalAmount !== null && order.totalAmount !== ''
      ? Number(order.totalAmount)
      : fallbackTotal;

  return (
    <Box maxWidth={800} mx="auto" px={1} py={2}>
      <Typography variant="h4" gutterBottom align="center">
        Order Summary
      </Typography>
      <Grid container spacing={2}>
        {/* Order Info */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Order Information
              </Typography>
              <Typography variant="body2">Order ID: {order.id}</Typography>
              <Typography variant="body2">
                Date: {formatDate(order.createdAt)}
              </Typography>
              <Box mt={1}>
                <Chip
                  label={order.status}
                  color={getStatusColor(order.status) as any}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Payment Info */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Payment
              </Typography>
              <Typography variant="body2">Method: {order.paymentMethod}</Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                Total: {formatCurrency(displayedTotal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Shipping Address */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Shipping Address
              </Typography>
              <Typography variant="body2">{order.address.street}</Typography>
              <Typography variant="body2">
                {order.address.city}, {order.address.state} {order.address.zipCode}
              </Typography>
              <Typography variant="body2">{order.address.country}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Order Items Table */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              src={item.image || '/placeholder.png'}
                              alt={item.name || 'Unknown Product'}
                              sx={{ width: 48, height: 48 }}
                              variant="rounded"
                            />
                            <span>{item.name && item.name !== 'null' ? item.name : 'Unknown Product'}</span>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderDetails; 