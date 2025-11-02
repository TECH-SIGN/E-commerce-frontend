import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container, Box, Typography, TextField, Button, Link, Alert, Paper, Divider, SvgIcon, SvgIconProps, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { toast } from 'react-toastify';
import { setCredentials } from '../../store/slices/authSlice';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { checkEmailExists } from '../../services/api';

function GoogleSvgIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.23-1.41 3.6-5.27 3.6-3.17 0-5.76-2.62-5.76-5.82s2.59-5.82 5.76-5.82c1.81 0 3.03.77 3.73 1.43l2.55-2.48C16.13 3.6 14.29 2.7 12.17 2.7 6.97 2.7 2.7 6.97 2.7 12.17s4.27 9.47 9.47 9.47c5.47 0 9.09-3.85 9.09-9.28 0-.62-.07-1.09-.16-1.56z" fill="#4285f4" />
      <path d="M3.15 7.47l2.4 1.76C6.6 7.7 8.97 5.7 12.17 5.7c1.81 0 3.03.77 3.73 1.43l2.55-2.48C16.13 3.6 14.29 2.7 12.17 2.7c-3.5 0-6.47 2.13-7.82 4.77z" fill="#ea4335" />
      <path d="M12.17 21.64c2.12 0 3.96-.7 5.28-1.91l-2.43-2.01c-.67.47-1.56.75-2.85.75-2.19 0-4.05-1.48-4.71-3.47l-2.38 1.84c1.34 2.63 4.32 4.8 7.09 4.8z" fill="#34a853" />
      <path d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.23-1.41 3.6-5.27 3.6-1.97 0-3.64-1.36-4.3-3.18l-2.38 1.84c1.34 2.63 4.32 4.8 7.09 4.8 2.12 0 3.96-.7 5.28-1.91l-2.43-2.01c-.67.47-1.56.75-2.85.75-2.19 0-4.05-1.48-4.71-3.47l-2.38 1.84c1.34 2.63 4.32 4.8 7.09 4.8z" fill="#fbbc05" />
    </SvgIcon>
  );
}

function FacebookSvgIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 5 3.66 9.13 8.44 9.88v-6.99h-2.54v-2.89h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 17 22 12z" fill="#fff" />
    </SvgIcon>
  );
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = 'Authentication failed';
      if (errorParam === 'no-email') {
        errorMessage = 'Google/Facebook account did not return an email. Please try again or use a different account.';
      } else if (errorParam === 'auth-failed') {
        errorMessage = 'Authentication failed. Please try again or contact support if the problem persists.';
      } else if (errorParam === 'access_denied') {
        errorMessage = 'Access was denied. Please try again and make sure to grant the necessary permissions.';
      } else if (errorParam === 'popup_closed') {
        errorMessage = 'Login popup was closed. Please try again.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [searchParams]);

  // Email format validation
  const validateEmailFormat = (email: string) => {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Debounced email existence check
  useEffect(() => {
    if (!email) {
      setEmailWarning('');
      return;
    }
    setEmailWarning('');
    setCheckingEmail(true);
    const handler = setTimeout(async () => {
      if (!validateEmailFormat(email)) {
        setEmailWarning('Invalid email format');
        setCheckingEmail(false);
        return;
      }
      try {
        const res = await checkEmailExists(email);
        if (!res.exists) {
          setEmailWarning('This email is not registered');
        } else {
          setEmailWarning('');
        }
      } catch (e) {
        setEmailWarning('Error checking email');
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      dispatch(setCredentials(response.data));
      localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      // console.log('API 401 error:', err.response);
      // console.log('API 401 error data:', err.response?.data);
      // try {
      //   // console.log('API 401 error data (stringified):', JSON.stringify(err.response?.data));
      //   // alert('API 401 error data: ' + JSON.stringify(err.response?.data));
      // } catch (e) {
      //   console.log('Error stringifying error data:', e);
      // }
      if (err.response?.data?.twoFactorRequired) {
        sessionStorage.setItem('pending2fa', JSON.stringify({ email, password }));
        navigate('/2fa', { state: { email, password } });
        return;
      }
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    }
  };

  const GOOGLE_CLIENT_ID = '481744542775-hm91mchs6cht3cdqp7p46pu8rdkektvm.apps.googleusercontent.com';
  // IMPORTANT: This must match the Google Cloud Console and backend env exactly
  const REDIRECT_URI = process.env.REACT_APP_GOOGLE_USER_REDIRECT_URI || "http://localhost/social-login-success";
  const SCOPE = 'email profile openid';

  const handleGoogleLogin = () => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI!)}&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;
    window.location.href = url;
  };

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
        <Box textAlign="center" mb={2}>
          <Typography variant="h4" fontWeight={600}>
            Sign in to your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access your personalized dashboard
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            error={!!emailWarning}
            helperText={checkingEmail ? 'Checking email...' : emailWarning}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
              Forgot password?
            </Link>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
          >
            Sign In
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">or sign in with</Typography>
        </Divider>

        {/* Social Login Buttons at the bottom */}
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <motion.div
            whileHover={{ scale: 1.04, boxShadow: '0 4px 20px rgba(66,133,244,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              startIcon={<GoogleSvgIcon />}
              sx={{
                borderColor: '#4285f4',
                color: '#222',
                fontWeight: 600,
                py: 1.5,
                background: '#fff',
                '&:hover': {
                  borderColor: '#3367d6',
                  background: 'rgba(66,133,244,0.07)'
                }
              }}
            >
              Continue with Google
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, boxShadow: '0 4px 20px rgba(24,119,242,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={handleFacebookLogin}
              startIcon={<FacebookSvgIcon />}
              sx={{
                background: '#1877f2',
                color: '#fff',
                fontWeight: 600,
                py: 1.5,
                '&:hover': {
                  background: '#166fe5',
                  color: '#fff'
                }
              }}
            >
              Continue with Facebook
            </Button>
          </motion.div>
        </Box>

        <Box textAlign="center" mt={3}>
          <Link component={RouterLink} to="/register" underline="hover">
            Don&apos;t have an account? <b>Sign up</b>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
