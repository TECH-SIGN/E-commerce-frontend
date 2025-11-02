import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { toast } from 'react-toastify';
import { setCredentials } from '../store/slices/authSlice';
import { motion } from 'framer-motion';
import api from '../services/api';

const SocialLoginSuccess: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSocialLoginSuccess = async () => {
      try {
        // Extract code from URL (for Google OAuth)
        const code = new URLSearchParams(window.location.search).get('code');
        const redirect_uri = process.env.REACT_APP_GOOGLE_USER_REDIRECT_URI || "http://localhost/social-login-success";
        if (!code) {
          setError('No authentication code received');
          toast.error('Authentication failed: No code received');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        // Use axios to call backend for token or 2FA
        const response = await api.post('/api/auth/google/exchange-code', { code, redirect_uri });
        const data = response.data;
        if (data.twoFactorRequired) {
          sessionStorage.setItem('pending2fa', JSON.stringify({ email: data.email }));
          navigate('/2fa', { state: { email: data.email } });
          return;
        }
        if (!data.token) {
          setError('No authentication token received');
          toast.error('Authentication failed: No token received');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        // Decode JWT token to get user info (without verification for display)
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          const user = {
            id: payload.userId,
            email: payload.email,
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            phoneNumber: payload.phoneNumber || '',
            role: payload.role || 'user',
            name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email,
            twoFactorEnabled: payload.twoFactorEnabled || false
          };
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(user));
          dispatch(setCredentials({ user, token: data.token }));
          toast.success('Login successful!');
          setLoading(false);
          setTimeout(() => navigate('/'), 1000);
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          setError('Invalid authentication token');
          toast.error('Authentication failed: Invalid token');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        if (err.response?.data?.twoFactorRequired) {
          sessionStorage.setItem('pending2fa', JSON.stringify({ email: err.response.data.email }));
          navigate('/2fa', { state: { email: err.response.data.email } });
          return;
        }
        const msg = err.response?.data?.message || 'Authentication failed';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    handleSocialLoginSuccess();
  }, [navigate, dispatch]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
          <Box textAlign="center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
            </motion.div>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Completing Login...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we authenticate your account
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
          <Box textAlign="center">
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login page...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return null;
};

export default SocialLoginSuccess; 