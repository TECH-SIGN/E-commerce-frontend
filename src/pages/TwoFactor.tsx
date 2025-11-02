import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';

const TwoFactor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Get credentials from location state or sessionStorage
  let email = "";
  let password = "";
  if (location.state && (location.state as any).email && (location.state as any).password) {
    email = (location.state as any).email;
    password = (location.state as any).password;
  } else {
    const pending = sessionStorage.getItem('pending2fa');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        email = parsed.email;
        password = parsed.password;
      } catch {}
    }
  }
  console.log('2FA page loaded with email:', email, 'password:', password); // DEBUG
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentialsMissing, setCredentialsMissing] = useState(false);

  useEffect(() => {
    if (!email) {
      setCredentialsMissing(true);
    }
  }, [email]);

  useEffect(() => {
    if (credentialsMissing) {
      navigate('/login');
    }
  }, [credentialsMissing, navigate]);

  // Detect if this is a Google login flow (no password present)
  const isGoogleFlow = !password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let response;
      if (isGoogleFlow) {
        // Google login: support TOTP or recovery code
        if (mode === 'recovery') {
          response = await api.post('/api/auth/google/verify-2fa', {
            email,
            recoveryCode
          });
        } else {
          response = await api.post('/api/auth/google/verify-2fa', {
            email,
            twoFactorToken: token
          });
        }
      } else {
        if (mode === 'recovery') {
          // Classic login with recovery code (password is required and was provided in the first step)
          const payload: { email: string; recoveryCode: string; password?: string } = { email, recoveryCode };
          if (password) payload.password = password;
          response = await api.post('/api/auth/login', payload);
        } else {
          // Classic login with TOTP
          const payload: { email: string; twoFactorToken: string; password?: string } = { email, twoFactorToken: token };
          if (password) payload.password = password;
          response = await api.post('/api/auth/login', payload);
        }
      }

      dispatch(setCredentials(response.data));
      localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
      sessionStorage.removeItem('pending2fa');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid 2FA code.');
      // Do NOT redirect to login, let user retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box display="flex" flexDirection="column" alignItems="center" minHeight="80vh" justifyContent="center">
        <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom textAlign="center">
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2} textAlign="center">
            Enter the 6-digit code from your authenticator app to continue.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            {mode === 'totp' ? (
              <TextField
                label="2FA Code"
                value={token}
                onChange={e => setToken(e.target.value)}
                fullWidth
                margin="normal"
                autoFocus
                inputProps={{ maxLength: 6 }}
                disabled={loading}
                helperText="Enter the 6-digit code from your authenticator app"
              />
            ) : (
              <TextField
                label="Recovery Code"
                value={recoveryCode}
                onChange={e => setRecoveryCode(e.target.value)}
                fullWidth
                margin="normal"
                autoFocus
                disabled={loading}
                placeholder="e.g., ABCD-EFGH-IJ"
                helperText="Enter one of your unused recovery codes"
              />
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading || (mode === 'totp' ? token.length !== 6 : recoveryCode.trim().length === 0)}
            >
              {loading ? <CircularProgress size={20} /> : 'Verify & Login'}
            </Button>
            {(
              // Allow recovery code for both classic and Google flows
              true
            ) && (
              <Button
                fullWidth
                variant="text"
                color="secondary"
                sx={{ mt: 1 }}
                onClick={() => {
                  setMode(mode === 'totp' ? 'recovery' : 'totp');
                  setError('');
                }}
                disabled={loading}
              >
                {mode === 'totp' ? 'Use a recovery code instead' : 'Use authenticator app code instead'}
              </Button>
            )}
            <Button
              fullWidth
              variant="text"
              color="secondary"
              sx={{ mt: 1 }}
              onClick={() => navigate('/login')}
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

export default TwoFactor; 