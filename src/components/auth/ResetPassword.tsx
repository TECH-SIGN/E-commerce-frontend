import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setMessage({
        type: 'error',
        text: 'Invalid reset link. Please request a new password reset.'
      });
      setTokenValid(false);
    } else {
      setToken(tokenParam);
      // Validate token with backend
      (async () => {
        try {
          await api.post('/api/auth/validate-reset-token', { token: tokenParam });
          setTokenValid(true);
        } catch (error: any) {
          setMessage({
            type: 'error',
            text: error.response?.data?.message || 'Invalid or expired reset link.'
          });
          setTokenValid(false);
        }
      })();
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.'
      });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/auth/reset-password', { 
        token, 
        password 
      });
      
      setMessage({
        type: 'success',
        text: response.data.message || 'Password has been reset successfully!'
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token || tokenValid === false) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Alert severity="error" sx={{ width: '100%' }}>
              {message?.text || 'Invalid reset link. Please request a new password reset.'}
            </Alert>
            
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/forgot-password')}
              sx={{ mt: 2 }}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  if (tokenValid === null) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          
          <Typography component="h1" variant="h5" gutterBottom>
            Reset Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your new password below.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ width: '100%', mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Reset Password'
              )}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ mt: 1 }}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 