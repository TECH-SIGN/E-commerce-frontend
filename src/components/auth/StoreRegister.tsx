import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { setCredentials } from '../../store/slices/authSlice';
import api from '../../services/api';
import OtpVerification from './OtpVerification';

const StoreRegister: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    storeName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔄 Store registration form submitted:', formData);

    // Validate required fields
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Request OTP with admin role for store registration
      const otpData = {
        ...formData,
        role: 'admin' // Automatically assign admin role for store registration
      };
      
      console.log('📤 Sending OTP request with data:', otpData);
      
      await api.post('/api/auth/request-signup-otp', otpData);
      
      console.log('✅ OTP request successful, showing verification screen');
      
      // Store form data for OTP verification
      sessionStorage.setItem('pendingOtpData', JSON.stringify(otpData));
      
      toast.success('OTP sent to your email! Please check your inbox.');
      setShowOtpVerification(true);
    } catch (err: any) {
      console.error('❌ OTP request failed:', err);
      setError(err.response?.data?.message || 'An error occurred');
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (token: string) => {
    // Extract user data from JWT token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.userId,
        email: payload.email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        phoneNumber: payload.phoneNumber || '',
        role: payload.role || 'admin',
        name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email,
        twoFactorEnabled: payload.twoFactorEnabled || false
      };
      
      // Store user data and token
      dispatch(setCredentials({ user, token }));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Clear session storage
      sessionStorage.removeItem('pendingOtpData');
      
      toast.success('Store registration successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Error parsing token:', error);
      toast.error('Registration successful but there was an issue with user data. Please login again.');
      navigate('/store/login');
    }
  };

  const handleOtpBack = () => {
    setShowOtpVerification(false);
    sessionStorage.removeItem('pendingOtpData');
  };

  // Show OTP verification if in OTP step
  if (showOtpVerification) {
    return (
      <OtpVerification
        email={formData.email}
        onSuccess={handleOtpSuccess}
        onBack={handleOtpBack}
        title="Verify Your Store Email"
        subtitle="Enter the 6-digit code sent to your email to complete store registration"
      />
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
        <Box textAlign="center" mb={3}>
          <StorefrontIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={600}>
            Register Your Store
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your store admin account
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="storeName"
                label="Store Name"
                name="storeName"
                autoComplete="organization"
                value={formData.storeName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="phoneNumber"
                label="Phone Number"
                type="tel"
                id="phoneNumber"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Sending OTP...
              </>
            ) : (
              'Send OTP & Continue'
            )}
          </Button>
          
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
            After clicking "Send OTP & Continue", you'll receive a 6-digit code via email to verify your account.
          </Typography>
          
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/store/login" variant="body2">
              Already have a store account? Sign in
            </Link>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/register" variant="body2">
              Regular customer registration
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default StoreRegister; 