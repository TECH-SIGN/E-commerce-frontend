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
import { paymentService, PaymentResponse } from '../services/paymentService';
import api from '../services/api';

interface PaymentProps {
  orderId?: string; // Make optional since we'll create order after payment
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: Error) => void;
  allowedMethods?: string[];
  orderData?: any; // Add order data to create order after payment
}

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment: React.FC<PaymentProps> = ({ orderId, amount, onSuccess, onError, allowedMethods, orderData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRazorpay();
  }, []);

  const createOrderAfterPayment = async (paymentData: any, backendPaymentId: string) => {
    try {
      if (!orderData) {
        throw new Error('Order data not provided');
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not authenticated');
      }
      const user = JSON.parse(userStr);

      const payload = {
        userId: user.id,
        email: user.email,
        phone: user.phoneNumber || user.phone || '',
        username: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || '',
        items: orderData.items,
        address: orderData.address,
        paymentMethod: 'online',
        paymentId: paymentData.id // Add payment ID to order
      };

      const res = await api.post('/api/orders', payload);

      // After creating order, attach order to payment for reconciliation
      try {
        await paymentService.attachOrder(backendPaymentId, res.data.id);
      } catch (attachErr) {
        console.warn('Failed to attach order to payment (will rely on backend reconciliation):', attachErr);
      }

      return res.data;
    } catch (error) {
      console.error('Failed to create order after payment:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment order using our service. Include minimal pricing snapshot to lock totals server-side.
      const response = await paymentService.createPayment(orderId || 'temp', amount, 'INR', 'upi', {
        subtotal: amount,
        discount_total: 0,
        taxes: 0,
        shipping: 0,
        total: amount,
        currency: 'INR',
        applied_discounts: []
      });

      if (!response.success) {
        throw new Error('Failed to create payment order');
      }

      const paymentId = response.data.id; // Save backend payment ID

      const options = {
        key: response.data.razorpay_key_id,
        amount: response.data.razorpay_order.amount,
        currency: response.data.razorpay_order.currency,
        name: 'Your E-commerce Store',
        description: `Order Payment`,
        order_id: response.data.razorpay_order.id,
        handler: async (razorpayResponse: any) => {
          try {
            const verificationResponse = await paymentService.verifyPayment(
              paymentId, // Use backend payment ID
              razorpayResponse.razorpay_payment_id,
              razorpayResponse.razorpay_signature
            );

            if (verificationResponse.success) {
              // Payment verified. Try to create the order; if it fails, still proceed to success flow
              try {
                const createdOrder = await createOrderAfterPayment(verificationResponse.data, paymentId);
                onSuccess({ orderId: createdOrder.id });
              } catch (creationErr) {
                console.warn('Order creation after payment failed. Falling back to orders list redirect.', creationErr);
                // Do not treat as a user-facing error since payment succeeded.
                onSuccess({ orderId: null, paymentId });
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Payment verification failed');
            onError(error instanceof Error ? error : new Error('Payment verification failed'));
          }
        },
        prefill: {
          email: response.data.metadata.customer_email
        },
        theme: {
          color: '#3f51b5'
        },
        method: {
          upi: allowedMethods ? allowedMethods.includes('upi') : true,
          card: allowedMethods ? allowedMethods.includes('card') : true,
          netbanking: false,
          wallet: false
        },
        modal: {
          ondismiss: () => {
            // Handle payment cancellation
            setError('Payment was cancelled');
            onError(new Error('Payment was cancelled'));
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMessage);
      onError(error instanceof Error ? error : new Error(errorMessage));
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