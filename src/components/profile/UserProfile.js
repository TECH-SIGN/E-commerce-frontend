import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateProfile,
  fetchProfile
} from '../../redux/slices/userSlice';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to update profile',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3}>
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            Profile Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>

          {error && (
            <Box mt={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfile; 