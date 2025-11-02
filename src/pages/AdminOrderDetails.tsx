import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Chip, List, ListItem, ListItemIcon, ListItemText, Button, Divider } from '@mui/material';
import { Person, Email, Phone, LocationOn, ShoppingCart, AttachMoney, Receipt } from '@mui/icons-material';
import api from '../services/api';

const AdminOrderDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/orders/${id}`);
        setOrder(res.data);
      } catch (err: any) {
        setError('Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;
  if (error) return <Box mt={2}><Typography color="error">{error}</Typography></Box>;
  if (!order) return <Box mt={2}><Typography>No order found.</Typography></Box>;

  return (
    <Box maxWidth={700} mx="auto" mt={4}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Order Details - #{order.id?.slice(-8)}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Customer Information</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><Person /></ListItemIcon>
                <ListItemText primary="Name" secondary={order.customerName || order.customer_name || 'N/A'} />
              </ListItem>
              <ListItem>
                <ListItemIcon><Email /></ListItemIcon>
                <ListItemText primary="Email" secondary={order.customerEmail || order.customer_email || 'N/A'} />
              </ListItem>
              <ListItem>
                <ListItemIcon><Phone /></ListItemIcon>
                <ListItemText primary="Phone" secondary={order.customerPhone || order.customer_phone || 'N/A'} />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationOn /></ListItemIcon>
                <ListItemText primary="Address" secondary={order.address ? `${order.address.street || ''}, ${order.address.city || ''}, ${order.address.state || ''}, ${order.address.country || ''}, ${order.address.zipCode || ''}` : 'N/A'} />
              </ListItem>
            </List>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Order Information</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><Receipt /></ListItemIcon>
                <ListItemText primary="Status" secondary={<Chip label={order.status} color="primary" size="small" />} />
              </ListItem>
              <ListItem>
                <ListItemIcon><AttachMoney /></ListItemIcon>
                <ListItemText primary="Total" secondary={`₹${Number(order.total || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon><ShoppingCart /></ListItemIcon>
                <ListItemText primary="Items" secondary={`${order.items?.length || 0} item(s)`} />
              </ListItem>
            </List>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>Order Items</Typography>
        <List dense>
          {order.items?.map((item: any, idx: number) => (
            <ListItem key={idx}>
              <ListItemText
                primary={item.productName || item.name || 'N/A'}
                secondary={`Quantity: ${item.quantity} • Price: ₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
              <Typography variant="body2" fontWeight="bold">
                ₹{Number(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </ListItem>
          ))}
        </List>
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminOrderDetails; 