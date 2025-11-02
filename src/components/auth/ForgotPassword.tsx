import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import api from '../../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage({
        type: 'success',
        text: response.data.message || 'Password reset link has been sent to your email.'
      });
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send password reset email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

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
          <EmailIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          
          <Typography component="h1" variant="h5" gutterBottom>
            Forgot Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => window.history.back()}
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

export default ForgotPassword; 