import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:80';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force logout/redirect for 401 if NOT on login or 2fa page and NOT a 2FA-required error
    const is2FA = error.response?.data?.twoFactorRequired;
    const isOnAuthPage = window.location.pathname === '/login' || window.location.pathname === '/2fa';
    if (error.response?.status === 401 && !is2FA && !isOnAuthPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 

export const getProductImage = async (productId:any) => {
  try {
    const res = await api.get(`/api/products/${productId}`);
    return res.data?.imageUrl || null; // assuming response = { imageUrl: '...' }
  } catch (err) {
    console.error('Error fetching image:', err);
    return null;
  }
};

export const sendChatbotMessage = async (message: string) => {
  const res = await api.post('/api/chatbot/message', { message });
  return res.data;
};

export const checkEmailExists = async (email: string) => {
  const res = await api.post('/api/auth/check-email', { email });
  return res.data; // { exists: true/false }
};

// NOTE: For user-specific products, use '/api/products/mine' endpoint instead of '?mine=true'.