import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = ({ orderId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRazorpay();
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      // Create payment order with user info
      const { data } = await axios.post('/api/payments/create', {
        order_id: orderId,
        amount: amount,
        currency: 'INR',
        email: user.email,
        phone: user.phoneNumber || user.phone || '',
        username: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || ''
      });

      const options = {
        key: data.data.razorpay_key_id,
        amount: data.data.razorpay_order.amount,
        currency: data.data.razorpay_order.currency,
        name: 'Your E-commerce Store',
        description: `Order #${orderId}`,
        order_id: data.data.razorpay_order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verificationResponse = await axios.post('/api/payments/verify', {
              payment_id: data.data.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResponse.data.success) {
              onSuccess(verificationResponse.data.data);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            setError(error.message);
            onError(error);
          }
        },
        prefill: {
          email: data.data.metadata.customer_email
        },
        theme: {
          color: '#3f51b5'
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      setError(error.message);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Order ID: {orderId}
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Amount: ₹{amount.toFixed(2)}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePayment}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Pay Now'
          )}
        </Button>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default Payment; 