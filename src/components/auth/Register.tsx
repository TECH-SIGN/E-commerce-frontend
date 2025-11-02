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
} from '@mui/material';
import { toast } from 'react-toastify';
import { setCredentials } from '../../store/slices/authSlice';
import api from '../../services/api';
import OtpVerification from './OtpVerification';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
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

    try {
      // Request OTP instead of direct registration
      await api.post('/api/auth/request-signup-otp', formData);
      
      // Store form data for OTP verification
      sessionStorage.setItem('pendingOtpData', JSON.stringify(formData));
      
      toast.success('OTP sent to your email! Please check your inbox.');
      setShowOtpVerification(true);
    } catch (err: any) {
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
        role: payload.role || 'user',
        name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email,
        twoFactorEnabled: payload.twoFactorEnabled || false
      };
      
      // Store user data and token
      dispatch(setCredentials({ user, token }));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Clear session storage
      sessionStorage.removeItem('pendingOtpData');
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      console.error('Error parsing token:', error);
      toast.error('Registration successful but there was an issue with user data. Please login again.');
      navigate('/login');
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
        title="Verify Your Email"
        subtitle="Enter the 6-digit code sent to your email to complete registration"
      />
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Sending OTP...' : 'Send OTP & Continue'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register; 