import React from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  Divider,
  TextField
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuantity, removeFromCart } from '../../redux/slices/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);

  const handleUpdateQuantity = (productId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Your cart is empty
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ my: 4 }}>
        Shopping Cart
      </Typography>
      <List>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem>
              <Box
                component="img"
                src={item.image_url || 'https://via.placeholder.com/100'}
                alt={item.name}
                sx={{ width: 100, height: 100, mr: 2 }}
              />
              <ListItemText
                primary={item.name}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    ${item.price} each
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    size="small"
                    value={item.quantity}
                    InputProps={{ readOnly: true }}
                    sx={{ width: 60, mx: 1 }}
                  />
                  <IconButton
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveItem(item.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" align="right">
          Total: ${total.toFixed(2)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => {/* Handle checkout */}}
        >
          Proceed to Checkout
        </Button>
      </Box>
    </Container>
  );
};

export default Cart; 