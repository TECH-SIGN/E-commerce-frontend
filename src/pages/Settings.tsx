import React, { useState, useEffect } from 'react';

import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Avatar
} from '@mui/material';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Settings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyStep, setVerifyStep] = useState(false);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null);

  // Set Password states
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'enter-password' | 'request-otp' | 'enter-otp' | 'complete'>('enter-password');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    setTwoFAEnabled(user?.twoFactorEnabled || false);
    if (user?.twoFactorEnabled) {
      setVerifyStep(false);
      setQrCode(null);
      setSecret(null);
      setToken('');
      // fetch remaining codes when 2FA is enabled
      (async () => {
        try {
          const res = await api.get('/api/auth/recovery-codes/remaining');
          setRemainingCodes(res.data?.remaining ?? null);
        } catch {
          setRemainingCodes(null);
        }
      })();
    }
  }, [user]);

  const handleEnable2FA = async () => {
    if (twoFAEnabled) {
      setMessage({ type: 'error', text: '2FA is already enabled.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/api/auth/enable-2fa');
      setQrCode(res.data.qrCodeDataURL);
      setSecret(res.data.secret);
      setVerifyStep(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start 2FA setup.';
      setMessage({ type: 'error', text: msg });
      if (msg.toLowerCase().includes('already enabled')) {
        setTwoFAEnabled(true);
        setVerifyStep(false);
        setQrCode(null);
        setSecret(null);
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/api/auth/verify-2fa', { token });
      setTwoFAEnabled(true);
      setVerifyStep(false);
      setQrCode(null);
      setSecret(null);
      setToken('');
      setMessage({ type: 'success', text: '2FA enabled successfully!' });
      if (Array.isArray(res.data?.recoveryCodes)) {
        setRecoveryCodes(res.data.recoveryCodes);
      }
      try {
        const remainingRes = await api.get('/api/auth/recovery-codes/remaining');
        setRemainingCodes(remainingRes.data?.remaining ?? null);
      } catch {}
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid 2FA code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/disable-2fa');
      setTwoFAEnabled(false);
      setRecoveryCodes(null);
      setRemainingCodes(null);
      setMessage({ type: 'success', text: '2FA disabled.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to disable 2FA.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/api/auth/generate-recovery-codes');
      if (Array.isArray(res.data?.recoveryCodes)) {
        setRecoveryCodes(res.data.recoveryCodes);
      }
      const remainingRes = await api.get('/api/auth/recovery-codes/remaining');
      setRemainingCodes(remainingRes.data?.remaining ?? null);
      setMessage({ type: 'success', text: 'Recovery codes regenerated. Save them now; you will not be able to view them again.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to regenerate recovery codes.' });
    } finally {
      setLoading(false);
    }
  };

  // Set Password handlers
  const handlePasswordValidation = () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return false;
    }
    
    if (passwordData.password.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return false;
    }
    
    setPasswordMessage(null);
    setPasswordStep('request-otp');
    return true;
  };

  const handleRequestPasswordOtp = async () => {
    if (!user?.email) {
      setPasswordMessage({ type: 'error', text: 'User email not found.' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      await api.post('/api/auth/request-set-password-otp', { email: user.email });
      setPasswordStep('enter-otp');
      setPasswordMessage({ type: 'success', text: 'OTP sent to your email!' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP.';
      setPasswordMessage({ type: 'error', text: errorMsg });
      if (err.response?.data?.IsSetted === 1) {
        setHasPassword(true);
        setPasswordStep('complete');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordData.otp) {
      setPasswordMessage({ type: 'error', text: 'Please enter the OTP.' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      await api.post('/api/auth/set-password', {
        email: user?.email,
        password: passwordData.password,
        otp: passwordData.otp
      });
      setPasswordStep('complete');
      setHasPassword(true);
      setPasswordMessage({ type: 'success', text: 'Password set successfully!' });
      // Clear form data
      setPasswordData({ password: '', confirmPassword: '', otp: '' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to set password.';
      setPasswordMessage({ type: 'error', text: errorMsg });
      if (err.response?.data?.IsSetted === 1) {
        setHasPassword(true);
        setPasswordStep('complete');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordFlow = () => {
    setPasswordStep('enter-password');
    setPasswordData({ password: '', confirmPassword: '', otp: '' });
    setPasswordMessage(null);
    setHasPassword(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 1 }}>
            S
          </Avatar>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Account Settings
          </Typography>
        </Box>
        <Typography variant="subtitle1" gutterBottom>
          Two-Factor Authentication (2FA)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Add an extra layer of security to your account using Google Authenticator or Authy.
        </Typography>
        {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
        {twoFAEnabled ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>2FA is currently <b>enabled</b> on your account.</Alert>
            {remainingCodes !== null && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Recovery codes remaining: <b>{remainingCodes}</b>
              </Alert>
            )}
            {recoveryCodes && recoveryCodes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Save these recovery codes now. They will not be shown again.
                </Alert>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', fontFamily: 'monospace', fontSize: 14 }}>
                  {recoveryCodes.map((c, idx) => (
                    <div key={idx}>{c}</div>
                  ))}
                </Paper>
              </Box>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRegenerateRecoveryCodes}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Regenerate Recovery Codes'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDisable2FA}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Disable 2FA'}
            </Button>
          </>
        ) : verifyStep ? (
          <>
            <Typography variant="body2" mb={1}>
              Scan this QR code with your authenticator app:
            </Typography>
            {qrCode && <Box display="flex" justifyContent="center" mb={2}><img src={qrCode} alt="2FA QR" style={{ width: 180, height: 180 }} /></Box>}
            <TextField
              label="Enter 6-digit code"
              value={token}
              onChange={e => setToken(e.target.value)}
              fullWidth
              margin="normal"
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleVerify2FA}
              disabled={loading || !token}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Verify & Enable 2FA'}
            </Button>
            <Button
              variant="text"
              color="secondary"
              onClick={() => { setVerifyStep(false); setQrCode(null); setSecret(null); setToken(''); }}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleEnable2FA}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={20} /> : 'Enable 2FA'}
          </Button>
        )}
        
        {/* Set Password Section */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle1" gutterBottom>
            Account Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Set a password for your account to enable direct login.
          </Typography>
          
          {passwordMessage && (
            <Alert severity={passwordMessage.type} sx={{ mb: 2 }}>
              {passwordMessage.text}
            </Alert>
          )}
          
          {hasPassword || passwordStep === 'complete' ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Password is <b>already set</b> for your account.
              </Alert>
              <Button
                variant="outlined"
                color="primary"
                onClick={resetPasswordFlow}
                disabled={passwordLoading}
                fullWidth
              >
                Change Password
              </Button>
            </>
          ) : passwordStep === 'enter-password' ? (
            <>
              <TextField
                label="New Password"
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
                fullWidth
                margin="normal"
                disabled={passwordLoading}
                helperText="Minimum 6 characters"
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                fullWidth
                margin="normal"
                disabled={passwordLoading}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handlePasswordValidation}
                disabled={passwordLoading || !passwordData.password || !passwordData.confirmPassword}
                fullWidth
                sx={{ mt: 2 }}
              >
                Continue
              </Button>
            </>
          ) : passwordStep === 'request-otp' ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Password validated! Click below to send OTP to your email.
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRequestPasswordOtp}
                disabled={passwordLoading}
                fullWidth
                sx={{ mb: 1 }}
              >
                {passwordLoading ? <CircularProgress size={20} /> : 'Send OTP to Email'}
              </Button>
              <Button
                variant="text"
                color="secondary"
                onClick={resetPasswordFlow}
                disabled={passwordLoading}
                fullWidth
              >
                Back to Password Entry
              </Button>
            </>
          ) : passwordStep === 'enter-otp' ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                OTP sent to your email! Check your inbox.
              </Alert>
              <TextField
                label="Enter OTP from Email"
                value={passwordData.otp}
                onChange={(e) => setPasswordData(prev => ({ ...prev, otp: e.target.value }))}
                fullWidth
                margin="normal"
                disabled={passwordLoading}
                helperText="Check your email for the 6-digit OTP"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSetPassword}
                disabled={passwordLoading || !passwordData.otp}
                fullWidth
                sx={{ mt: 2, mb: 1 }}
              >
                {passwordLoading ? <CircularProgress size={20} /> : 'Set Password'}
              </Button>
              <Button
                variant="text"
                color="secondary"
                onClick={resetPasswordFlow}
                disabled={passwordLoading}
                fullWidth
              >
                Cancel
              </Button>
            </>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;