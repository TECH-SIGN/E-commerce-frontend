import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Button, Box, Divider, TextField, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const Cart = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchCart = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/cart/${user.id}`);
      const cartItems = res.data;

      const itemsWithImages = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const productRes = await api.get(`/api/products/${item.product_id}`);
            const product = productRes.data;
            return {
              ...item,
              name: product.name,
              price: parseFloat(product.price),
              image_url: product.images?.[0]
                ? `http://localhost/uploads/${product.images[0].split('/').pop()}`
                : '/fallback.jpg',
            };
          } catch (error) {
            console.error(`Failed to fetch product ${item.product_id}:`, error);
            return item;
          }
        })
      );

      setItems(itemsWithImages);
      calculateTotal(itemsWithImages);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items) => {
    const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(totalAmount);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Refresh cart when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      fetchCart();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleUpdateQuantity = useCallback(async (productId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;

    // Optimistic update - update UI immediately
    const updatedItems = items.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);

    // Clear any existing timeout for this product
    const existingTimeout = pendingUpdates.get(productId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set a new timeout for this update
    const timeoutId = setTimeout(async () => {
      try {
        await api.put('/api/cart/update-quantity', {
          userId: user.id,
          productId,
          quantity: newQuantity
        });
        // Remove from pending updates on success
        setPendingUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(productId);
          return newMap;
        });
      } catch (err) {
        // Revert optimistic update on error
        fetchCart();
        let msg = 'Failed to update quantity';
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setSnackbar({ open: true, message: msg, severity: 'error' });
        // Remove from pending updates on error
        setPendingUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(productId);
          return newMap;
        });
      }
    }, 500); // 500ms debounce

    // Store the timeout ID
    setPendingUpdates(prev => new Map(prev).set(productId, timeoutId));
  }, [items, user, pendingUpdates]);

  const handleRemoveItem = async (productId) => {
    // Optimistic update - remove item immediately from UI
    const updatedItems = items.filter(item => item.product_id !== productId);
    setItems(updatedItems);
    calculateTotal(updatedItems);

    try {
      await api.delete('/api/cart', {
        data: { userId: user.id, productId }
      });
      // No need to fetchCart() - we already updated the state optimistically
    } catch (err) {
      // Revert optimistic update on error
      fetchCart();
      setSnackbar({ open: true, message: 'Failed to remove item', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>Loading cart...</Typography>
        </Box>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Your cart is empty
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" color="primary" onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </Box>
        <Box display="flex" justifyContent="center" mt={1}>
          <Button variant="outlined" size="small" onClick={fetchCart}>
            Refresh Cart
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ my: 4 }}>Shopping Cart</Typography>
      <List>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem>
              <Box
                component="img"
                src={item.image_url || '/fallback.jpg'}
                alt={item.name}
                sx={{ width: 100, height: 100, mr: 2 }}
              />
              <ListItemText
                primary={item.name}
                secondary={<Typography variant="body2" color="text.secondary">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} each</Typography>}
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity, -1)}
                    disabled={pendingUpdates.has(item.product_id)}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField 
                    size="small" 
                    value={item.quantity} 
                    InputProps={{ 
                      readOnly: true,
                      endAdornment: pendingUpdates.has(item.product_id) ? (
                        <CircularProgress size={16} />
                      ) : null
                    }} 
                    sx={{ width: 60, mx: 1 }} 
                  />
                  <IconButton 
                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity, 1)}
                    disabled={pendingUpdates.has(item.product_id)}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveItem(item.product_id)} 
                    sx={{ ml: 1 }}
                    disabled={pendingUpdates.has(item.product_id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" align="right">Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
