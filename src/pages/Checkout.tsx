import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Card
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Payment from '../components/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
// Removed unused QrCodeIcon
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, setCart } from '../store/slices/cartSlice';
import { RootState, AppDispatch } from '../store';
import userService, { UserAddress } from '../services/userService';
import api from '../services/api';
import { debounce } from '../utils/debounce';

interface CartItem {
  product_id: string;
  name?: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Checkout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: reduxCartItems, total: reduxCartTotal } = useSelector((state: RootState) => state.cart);
  
  // Debug cart state
  console.log('🛒 Current cart state:', { reduxCartItems, reduxCartTotal, cartItemsLength: reduxCartItems?.length });
  
  const [address, setAddress] = useState<Address>({
    street: '', city: '', state: '', zipCode: '', country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressValidation, setAddressValidation] = useState<Record<string, boolean>>({});
  const [cartLoading, setCartLoading] = useState(false);
  // Persist the intent to add a new address so a page refresh doesn't reselect the default
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('checkout_isAddingNewAddress') === '1';
    } catch {
      return false;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if this is a buy-now flow
  const isBuyNowFlow = Boolean(location.state?.buyNow);
  const buyNowProduct = location.state?.buyNow;
  
  // Use appropriate items and total based on flow type
  const cartItems = useMemo(() => {
    if (isBuyNowFlow && buyNowProduct) {
      // For buy-now, only show the buy-now product
      return [{
        id: buyNowProduct.id,
        productId: buyNowProduct.id,
        name: buyNowProduct.name,
        price: buyNowProduct.price,
        quantity: buyNowProduct.quantity || 1,
        product: buyNowProduct
      }];
    }
    // For regular checkout, use cart items
    return reduxCartItems || [];
  }, [isBuyNowFlow, buyNowProduct, reduxCartItems]);
  
  const cartTotal = useMemo(() => {
    if (isBuyNowFlow && buyNowProduct) {
      // For buy-now, calculate total from buy-now product only
      return (buyNowProduct.price || 0) * (buyNowProduct.quantity || 1);
    }
    // For regular checkout, use cart total
    return reduxCartTotal || 0;
  }, [isBuyNowFlow, buyNowProduct, reduxCartTotal]);
  
  console.log('🛒 Effective items and total:', { 
    isBuyNowFlow, 
    cartItems, 
    cartTotal, 
    buyNowProduct: buyNowProduct ? { id: buyNowProduct.id, name: buyNowProduct.name, price: buyNowProduct.price } : null 
  });

  // Debounced address validation
  const debouncedAddressValidation = useMemo(
    () => debounce((address: Address) => {
      const validation: Record<string, boolean> = {};
      
      // Validate street address
      validation.street = address.street.trim().length >= 5;
      
      // Validate city
      validation.city = address.city.trim().length >= 2;
      
      // Validate state
      validation.state = address.state.trim().length >= 2;
      
      // Validate zip code
      validation.zipCode = /^\d{5,6}$/.test(address.zipCode.trim());
      
      // Validate country
      validation.country = address.country.trim().length >= 2;
      
      setAddressValidation(validation);
    }, 300),
    []
  );

  // Memoized address validation status
  const isAddressValid = useMemo(() => {
    return Object.values(addressValidation).every(Boolean);
  }, [addressValidation]);

  // Function to load cart data from backend
  const loadCartData = useCallback(async () => {
    try {
      setCartLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('No user found, skipping cart load');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user?.id) {
        console.log('Invalid user data, skipping cart load');
        return;
      }

      console.log('Loading cart data for user:', user.id);
      const response = await api.get(`/api/cart/${user.id}`);
      const cartData = response.data;
      console.log('🛒 Raw cart data from backend:', cartData);

      if (cartData && Array.isArray(cartData) && cartData.length > 0) {
        console.log('🛒 Processing', cartData.length, 'cart items');
        // Fetch product details for each cart item
        const transformedItems = await Promise.all(
          cartData.map(async (item: any) => {
            console.log('🛒 Processing cart item:', item);
            try {
              // Fetch product details
              const productResponse = await api.get(`/api/products/${item.product_id}`);
              const product = productResponse.data;
              console.log('🛒 Product details fetched:', product);
              
              return {
                id: item.product_id,
                productId: item.product_id,
                quantity: item.quantity,
                price: product.price || 0,
                product: product
              };
            } catch (error) {
              console.error(`Failed to fetch product ${item.product_id}:`, error);
              // Return item with default values if product fetch fails
              return {
                id: item.product_id,
                productId: item.product_id,
                quantity: item.quantity,
                price: 0,
                product: null
              };
            }
          })
        );

        // Calculate total from transformed items
        const total = transformedItems.reduce((sum: number, item: any) => {
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          console.log('🛒 Item total calculation:', { itemId: item.id, price: item.price, quantity: item.quantity, itemTotal });
          return sum + itemTotal;
        }, 0);
        
        // Dispatch action to update cart state
        dispatch(setCart({
          items: transformedItems,
          total: total
        }));

        console.log('🛒 Cart data loaded successfully:', transformedItems);
        console.log('🛒 Cart total calculated:', total);
      } else {
        console.log('🛒 No cart items found or empty cart data');
        // Clear cart if no items found
        dispatch(setCart({
          items: [],
          total: 0
        }));
      }
    } catch (error) {
      console.error('Failed to load cart data:', error);
      // Clear cart on error to prevent stale data
      dispatch(setCart({
        items: [],
        total: 0
      }));
    } finally {
      setCartLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.buyNow) {
      const buyNowProduct = location.state.buyNow;
      // For buy now, we don't need to set cart items since we're using Redux
      // The total will be calculated from the buy now product
      setFetching(false);
    } else {
      // Always refresh cart from backend to ensure latest quantities are used
      // (e.g., when user changed quantity to 2 in Cart page just before checkout)
      loadCartData();
      setFetching(false);
    }
  }, [location.state?.buyNow, loadCartData]); // intentionally exclude cartItems to avoid loops

  // When a saved address is selected, fill the form
  useEffect(() => {
    if (selectedAddressId && !isAddingNewAddress) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setAddress({
          street: addr.streetAddress,
          city: addr.city,
          state: addr.state,
          zipCode: addr.postalCode,
          country: addr.country
        });
      }
    } else {
      setAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
    }
  }, [selectedAddressId, savedAddresses, isAddingNewAddress]);

  // Debug: log saved addresses
  console.log('Saved addresses:', savedAddresses);

  // Optimized address loading with better error handling
  const loadSavedAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      const addresses = await userService.getAddresses();
      setSavedAddresses(addresses);
      
      // Auto-select default address if available
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (!isAddingNewAddress && defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
      // Don't show error to user as it's not critical
    } finally {
      setAddressesLoading(false);
    }
  }, [selectedAddressId, isAddingNewAddress]);

  // Load addresses on component mount
  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedAddressValidation.cancel();
    };
  }, [debouncedAddressValidation]);

  // Payment success handler: clear cart and redirect
  const handlePaymentSuccess = useCallback(async (data: any) => {
    try {
      setShowPayment(false);
      setLoading(false);
      setSuccess('Payment successful!');

      // Redirect immediately for better UX
      if (data && data.orderId) {
        navigate(`/orders/${data.orderId}`);
      } else {
        navigate('/orders');
      }

      // Clear cart in the background (do not block navigation)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) {
          clearUserCart(user.id).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Post-payment handling failed:', err);
      navigate('/orders');
    }
  }, [navigate]);

  // Payment error handler: surface error and keep user on checkout
  const handlePaymentError = useCallback((error: Error) => {
    setShowPayment(false);
    setLoading(false);
    setError(error?.message || 'Payment failed');
  }, []);

  // Normalize addresses to ensure isDefault/isActive are booleans
  const normalizedAddresses = Array.isArray(savedAddresses)
    ? savedAddresses.map(addr => ({
        ...addr,
        isDefault: Boolean(addr.isDefault),
        isActive: Boolean(addr.isActive)
      }))
    : [];

  // Optimized address change handler with debouncing
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newAddress = { ...address, [e.target.name]: e.target.value };
    setAddress(newAddress);
    
    // Debounced validation
    debouncedAddressValidation(newAddress);
  }, [address, debouncedAddressValidation]);

  // Optimized payment method change handler
  const handlePaymentMethodChange = useCallback((method: 'cod' | 'online') => {
    setPaymentMethod(method);
    // Clear any existing errors when payment method changes
    setError('');
  }, []);

  // Function to clear user cart
  const clearUserCart = async (userId: string) => {
    try {
      await api.delete(`/api/cart/clear/${userId}`);
      console.log('Cart cleared successfully');
      // Also clear Redux cart state
      dispatch(clearCart());
      setSuccess(prev => prev + ' Cart has been cleared.');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Don't show error to user as order was successful, but log it
      setError(prev => prev + ' (Note: Cart may not have been cleared automatically)');
    }
  };

  // Optimized form submission with better validation
  const handleSubmit = useCallback(async () => {
    
    // Validate address before submission
    if (!isAddressValid) {
      setError('Please fill in all address fields correctly');
      return;
    }
    
    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      setError('No items in cart');
      return;
    }
    
    // Validate cart total
    if (cartTotal <= 0) {
      setError('Invalid cart total');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      setError('Invalid user data');
      setLoading(false);
      return;
    }
    
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    // Validate address data
    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !address[field as keyof Address]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    // For online payment, show payment modal and do not create order yet
    if (paymentMethod === 'online') {
      setPendingOrderData({
        userId: user.id,
        email: user.email,
        phone: user.phoneNumber || user.phone || '',
        username: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || '',
        items: cartItems.map((item) => ({
          productId: item.id || item.productId,
          quantity: item.quantity,
          price: item.price // Frontend does not apply discounts
        })),
        address,
        paymentMethod
      });
      setShowPayment(true);
      setLoading(false);
      return;
    }

    // For COD, create order immediately
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        phone: user.phoneNumber || user.phone || '',
        username: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || '',
        items: cartItems.map((item) => ({
          productId: item.id || item.productId,
          quantity: item.quantity,
          price: item.price // COD uses full price
        })),
        address,
        paymentMethod,
        totalAmount: cartTotal, // COD uses full amount
        originalAmount: cartTotal,
        discountAmount: 0 // No discount for COD
      };
      
      console.log('Creating order with payload:', payload);
      
      const res = await api.post('/api/orders', payload);
      setCreatedOrderId(res.data.id);
      setOrderCreated(true);
      setSuccess('Order created successfully!');
      
      // Clear cart after successful COD order
      await clearUserCart(user.id);
      
      // Navigate to order details page immediately after successful order
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      let message = 'Failed to place order';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error('Order creation error:', err);
    }
  }, [navigate, cartItems, cartTotal, paymentMethod, address]);

  const renderPaymentOptions = useMemo(() => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card
          onClick={() => handlePaymentMethodChange('cod')}
          sx={{
            border: paymentMethod === 'cod' ? '2px solid #1976d2' : '2px solid #e0e0e0',
            backgroundColor: paymentMethod === 'cod' ? '#f8fbff' : 'white',
            boxShadow: paymentMethod === 'cod' ? '0 8px 24px rgba(25, 118, 210, 0.12)' : '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            p: 3,
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            minHeight: 220,
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
              borderColor: '#1976d2',
              boxShadow: '0 12px 32px rgba(25, 118, 210, 0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          {/* Selection indicator */}
          {paymentMethod === 'cod' && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'white'
                }}
              />
            </Box>
          )}
          
          {/* Header Section */}
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}
              >
                <LocalAtmIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#2c3e50', mb: 0.5 }}>
                  Cash on Delivery
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Pay when you receive
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Amount Section */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Amount
              </Typography>
              <Typography variant="h5" fontWeight={700} color="#1976d2">
                ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            
            {/* Additional Info */}
            <Box p={1.5} sx={{ backgroundColor: '#e8f5e8', borderRadius: 2 }}>
              <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5} fontWeight={500}>
                <Box component="span" sx={{ fontSize: 12 }}>✓</Box>
                Instant confirmation & faster delivery
              </Typography>
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card
          onClick={() => handlePaymentMethodChange('online')}
          sx={{
            border: paymentMethod === 'online' ? '2px solid #1976d2' : '2px solid #e0e0e0',
            backgroundColor: paymentMethod === 'online' ? '#f8fbff' : 'white',
            boxShadow: paymentMethod === 'online' ? '0 8px 24px rgba(25, 118, 210, 0.12)' : '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            p: 3,
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            minHeight: 220,
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
              borderColor: '#1976d2',
              boxShadow: '0 12px 32px rgba(25, 118, 210, 0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          {/* Selection indicator */}
          {paymentMethod === 'online' && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'white'
                }}
              />
            </Box>
          )}
          
          {/* Header Section */}
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                }}
              >
                <CreditCardIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#2c3e50', mb: 0.5 }}>
                  Pay Online
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Secure payment gateway
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Amount Section */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Amount
              </Typography>
              <Typography variant="h5" fontWeight={700} color="#1976d2">
                ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            
            {/* Additional Info */}
            <Box p={1.5} sx={{ backgroundColor: '#e8f5e8', borderRadius: 2 }}>
              <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5} fontWeight={500}>
                <Box component="span" sx={{ fontSize: 12 }}>✓</Box>
                Instant confirmation & faster delivery
              </Typography>
            </Box>
          </Box>
        </Card>
      </Grid>
    </Grid>
  ), [paymentMethod, cartTotal, handlePaymentMethodChange]);

  if (fetching || cartLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {cartLoading ? 'Loading your cart...' : 'Loading checkout...'}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Redirect if no items in cart after loading
  if (!cartLoading && (!cartItems || cartItems.length === 0) && !orderCreated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Typography variant="h5" gutterBottom color="text.secondary">
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add some products to your cart to continue with checkout
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/products')}
            sx={{ px: 4, py: 1.5 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" mt={4} mb={4}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Checkout
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {showPayment && paymentMethod === 'online' && pendingOrderData ? (
              <Payment
                amount={cartTotal}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                allowedMethods={['upi', 'card']}
                orderData={pendingOrderData}
              />
            ) : !orderCreated ? (
              <>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Shipping Address
                </Typography>
                {/* Address selection UI */}
                {addressesLoading ? (
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <CircularProgress size={20} />
                    <Typography>Loading addresses...</Typography>
                  </Box>
                ) : normalizedAddresses.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                      Choose a saved address:
                    </Typography>
                    <List sx={{ mb: 2 }}>
                      {normalizedAddresses.map(addr => (
                        <ListItem key={addr.id} disablePadding sx={{ mb: 1 }}>
                          <Button
                            variant={selectedAddressId === addr.id ? 'contained' : 'outlined'}
                            color={addr.isDefault ? 'primary' : 'inherit'}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setIsAddingNewAddress(false);
                              try { sessionStorage.setItem('checkout_isAddingNewAddress', '0'); } catch {}
                            }}
                            sx={{ 
                              width: '100%', 
                              textAlign: 'left', 
                              justifyContent: 'flex-start',
                              py: 2,
                              px: 3,
                              borderRadius: 2
                            }}
                          >
                            <ListItemText
                              primary={`${addr.streetAddress}, ${addr.city}, ${addr.state}, ${addr.country} - ${addr.postalCode}`}
                              secondary={addr.label ? `${addr.label}${addr.isDefault ? ' (Default)' : ''}` : addr.isDefault ? 'Default' : ''}
                            />
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant="text"
                      color="secondary"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setIsAddingNewAddress(true);
                        try { sessionStorage.setItem('checkout_isAddingNewAddress', '1'); } catch {}
                        // ensure form is cleared for new address
                        setAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
                      }}
                      sx={{ mt: 1 }}
                    >
                      + Enter a new address
                    </Button>
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Street Address" 
                      name="street" 
                      value={address.street} 
                      onChange={handleChange} 
                      margin="normal" 
                      required 
                      disabled={!!selectedAddressId && !isAddingNewAddress}
                      error={addressValidation.street === false}
                      helperText={addressValidation.street === false ? 'Street address must be at least 5 characters' : ''}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="City" 
                      name="city" 
                      value={address.city} 
                      onChange={handleChange} 
                      margin="normal" 
                      required 
                      disabled={!!selectedAddressId && !isAddingNewAddress}
                      error={addressValidation.city === false}
                      helperText={addressValidation.city === false ? 'City must be at least 2 characters' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="State" 
                      name="state" 
                      value={address.state} 
                      onChange={handleChange} 
                      margin="normal" 
                      required 
                      disabled={!!selectedAddressId && !isAddingNewAddress}
                      error={addressValidation.state === false}
                      helperText={addressValidation.state === false ? 'State must be at least 2 characters' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Zip Code" 
                      name="zipCode" 
                      value={address.zipCode} 
                      onChange={handleChange} 
                      margin="normal" 
                      required 
                      disabled={!!selectedAddressId && !isAddingNewAddress} 
                      type="number" 
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      error={addressValidation.zipCode === false}
                      helperText={addressValidation.zipCode === false ? 'Zip code must be 5-6 digits' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Country" 
                      name="country" 
                      value={address.country} 
                      onChange={handleChange} 
                      margin="normal" 
                      required 
                      disabled={!!selectedAddressId && !isAddingNewAddress}
                      error={addressValidation.country === false}
                      helperText={addressValidation.country === false ? 'Country must be at least 2 characters' : ''}
                    />
                  </Grid>
                </Grid>
                
                {renderPaymentOptions}
                
                {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
                
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || !isAddressValid}
                  onClick={handleSubmit}
                  sx={{ 
                    mt: 3, 
                    py: 2, 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Order'}
                </Button>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Alert severity="success" sx={{ fontSize: '1.1rem', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🎉 Order placed successfully!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Your order has been created with Cash on Delivery payment method.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Order ID: {createdOrderId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You will be redirected to order details in a few seconds...
                  </Typography>
                </Alert>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate(`/orders/${createdOrderId}`)}
                  sx={{ mr: 2 }}
                >
                  View Order Details
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Order Summary
            </Typography>
            {cartItems && cartItems.length > 0 ? (
              <>
                <List sx={{ mb: 3 }}>
                  {cartItems.map((item, idx) => (
                    <ListItem key={item.id || item.productId || idx} sx={{ px: 0, py: 1 }}>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={500}>
                            {item.product?.name || item.name || `Product ${item.id || item.productId}`}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity}
                          </Typography>
                        }
                      />
                      <Typography variant="subtitle1" fontWeight={600}>
                        ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Subtotal */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight={500}>Subtotal:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                
                {/* Final Total */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={600}>Total:</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No items in cart
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add some products to your cart to continue
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Checkout;