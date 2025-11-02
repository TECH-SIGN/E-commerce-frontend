import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Add interface for user info
interface UserInfo {
  email: string;
  phone?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

// Get user info from localStorage with fallback values
function getUserInfo(): UserInfo {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return { email: '' };
    
    const user = JSON.parse(userStr);
    return {
      email: user.email || '',
      phone: user.phoneNumber || user.phone || '',
      username: user.firstName ? 
        `${user.firstName} ${user.lastName || ''}`.trim() : 
        user.username || ''
    };
  } catch (error) {
    console.warn('Failed to parse user info from localStorage:', error);
    return { email: '' };
  }
}

export interface PaymentResponse {
  success: boolean;
  data: {
    id: string;
    razorpay_key_id: string;
    razorpay_order: {
      id: string;
      amount: number;
      currency: string;
    };
    metadata: {
      customer_email: string;
    };
  };
}

export interface PaymentVerificationResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    order_id: string;
  };
}

export interface PricingSnapshot {
  subtotal: number | null;
  discount_total: number | null;
  taxes: number;
  shipping: number;
  total: number | null;
  currency: string;
  applied_discounts: any[];
}

export const paymentService = {
  createPayment: async (
    orderId: string, 
    amount: number, 
    currency: string = 'INR', 
    payment_method: string = 'upi',
    pricing?: PricingSnapshot,
    pricing_id?: string
  ): Promise<PaymentResponse> => {
    const userInfo = getUserInfo();
    
    const response = await axios.post(
      `${API_URL}/api/payments/create`,
      {
        order_id: orderId,
        amount,
        currency,
        payment_method,
        // Include user info in payment payload
        email: userInfo.email,
        phone: userInfo.phone,
        username: userInfo.username,
        pricing,
        pricing_id
      },
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  },

  verifyPayment: async (
    paymentId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentVerificationResponse> => {
    const response = await axios.post(
      `${API_URL}/api/payments/verify`,
      {
        payment_id: paymentId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      },
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  },

  getPaymentHistory: async (): Promise<any> => {
    const response = await axios.get(
      `${API_URL}/api/payments/user/history`, 
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  },

  getPaymentStats: async (): Promise<any> => {
    const response = await axios.get(
      `${API_URL}/api/payments/user/stats`, 
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  },

  attachOrder: async (paymentId: string, orderId: string): Promise<any> => {
    const response = await axios.post(
      `${API_URL}/api/payments/${paymentId}/attach-order`,
      { order_id: orderId },
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  }
}; 