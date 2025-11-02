import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Grid
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface OtpVerificationProps {
  email: string;
  onSuccess: (token: string) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  onSuccess,
  onBack,
  title = "Verify Your Email",
  subtitle = "Enter the 6-digit code sent to your email"
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/verify-signup-otp', {
        email,
        otp
      });

      toast.success('Email verified successfully!');
      onSuccess(response.data.token);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      // Get form data from sessionStorage (stored during OTP request)
      const formDataStr = sessionStorage.getItem('pendingOtpData');
      if (!formDataStr) {
        setError('No registration data found. Please start over.');
        return;
      }

      const formData = JSON.parse(formDataStr);
      await api.post('/api/auth/request-signup-otp', formData);
      
      toast.success('OTP resent successfully!');
      setCountdown(60); // 60 second cooldown
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box display="flex" flexDirection="column" alignItems="center" minHeight="80vh" justifyContent="center">
        <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom textAlign="center">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
            {subtitle}
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleVerifyOtp}>
            <TextField
              label="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              fullWidth
              margin="normal"
              autoFocus
              inputProps={{ 
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.2em', letterSpacing: '0.5em' }
              }}
              disabled={loading}
              placeholder="000000"
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? <CircularProgress size={20} /> : 'Verify & Complete Registration'}
            </Button>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="text"
                  color="secondary"
                  onClick={onBack}
                  disabled={loading}
                >
                  Back
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="text"
                  color="primary"
                  onClick={handleResendOtp}
                  disabled={loading || resendLoading || countdown > 0}
                >
                  {resendLoading ? (
                    <CircularProgress size={16} />
                  ) : countdown > 0 ? (
                    `Resend (${countdown}s)`
                  ) : (
                    'Resend OTP'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default OtpVerification; 