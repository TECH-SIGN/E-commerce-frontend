import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Star as StarIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { RootState } from '../store';
import userService, {
  UserProfile,
  UserAddress,
  UserActivity,
  UserStats,
  CompleteUserProfile,
  AddressData,
  ProfileUpdateData
} from '../services/userService';
import api from '../services/api';
import axios from 'axios';

const backendBaseUrl = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost';

const getAvatarUrl = (avatarUrl: string | undefined) => {
  if (!avatarUrl) return '/default-avatar.png';
  if (avatarUrl.startsWith('/uploads/')) {
    return API_BASE_URL + avatarUrl;
  }
  return avatarUrl;
};

const defaultUserStats: UserStats = {
  totalAddresses: 0,
  totalActivities: 0,
  profileCompleteness: 0,
  lastActivityDate: '',
  memberSince: ''
};

const Profile: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const authUserId = useSelector((state: any) => state.auth.user?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [editProfile, setEditProfile] = useState<ProfileUpdateData>({});
  const [editMode, setEditMode] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressData>({
    type: 'home',
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false,
    label: ''
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressFieldErrors, setAddressFieldErrors] = useState<{ [key: string]: string }>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const complete = await userService.getCompleteProfile();
      const rawProfile = complete.profile as any;
      const normalizedProfile = rawProfile
        ? {
            ...rawProfile,
            dateOfBirth: rawProfile.dateOfBirth
              ? rawProfile.dateOfBirth.slice(0, 10)
              : rawProfile.date_of_birth
              ? rawProfile.date_of_birth.slice(0, 10)
              : '',
            avatarUrl: rawProfile.avatarUrl || rawProfile.avatar_url || ''
          }
        : null;
      setProfile(normalizedProfile);
      setEditProfile({
        bio: normalizedProfile?.bio || '',
        dateOfBirth: normalizedProfile?.dateOfBirth || '',
        avatarUrl: normalizedProfile?.avatarUrl || '',
        website: normalizedProfile?.website || '',
        location: normalizedProfile?.location || '',
        isPublicProfile: normalizedProfile?.isPublicProfile ?? false
      });
      setAddresses(complete.addresses || []);
      setStats(complete.stats || defaultUserStats);
      setActivities(complete.recentActivities || []);
      // Always use authUserId to fetch email
      if (authUserId) {
        try {
          const res = await axios.get(`/api/auth/user/${authUserId}`);
          setEmail(res.data.email || '');
        } catch (err) {
          setEmail('');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred while fetching profile data.';
      console.error("Detailed error fetching profile:", error);
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let dateOfBirth = editProfile.dateOfBirth && editProfile.dateOfBirth.trim() !== ''
        ? new Date(editProfile.dateOfBirth).toISOString().slice(0, 10)
        : undefined;
      let avatarUrl = editProfile.avatarUrl || undefined;
      await userService.updateProfile({
        ...editProfile,
        avatarUrl,
        dateOfBirth
      });
      toast.success('Profile updated successfully');
      setEditMode(false);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError(null);
    setAddressFieldErrors({});
    try {
      await userService.addAddress(newAddress);
      toast.success('Address added successfully');
      setNewAddress({
        type: 'home',
        streetAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        isDefault: false,
        label: ''
      });
      fetchAll();
      setOpenAddDialog(false);
    } catch (error: any) {
      // Try to extract validation errors
      let msg = error.message || 'Failed to add address';
      let fieldErrors: { [key: string]: string } = {};
      if (error.response?.data?.errors) {
        msg = error.response.data.message || msg;
        for (const err of error.response.data.errors) {
          if (err.path && err.msg) fieldErrors[err.path] = err.msg;
        }
      }
      setAddressError(msg);
      setAddressFieldErrors(fieldErrors);
      toast.error(msg);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setAddressLoading(true);
    try {
      await userService.deleteAddress(id);
      toast.success('Address deleted');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    setAddressLoading(true);
    try {
      await userService.setDefaultAddress(id);
      toast.success('Default address set');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set default address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('photo', e.target.files[0]);
      try {
        const res = await api.post('/api/users/profile/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const photoUrl = res.data.url;
        await userService.updateProfile({ ...editProfile, avatarUrl: photoUrl });
        fetchAll();
      } catch (error: any) {
        toast.error(error.message || 'Failed to upload profile photo');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error" variant="h6">Failed to load profile data.</Typography>
        <Typography color="error.light" variant="body1">{error}</Typography>
        <Button variant="contained" onClick={fetchAll} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="warning.main" variant="h6">Your profile is being set up.</Typography>
        <Typography color="text.secondary" variant="body1">
          Please refresh in a few moments or contact support if this persists.
        </Typography>
        <Button variant="contained" onClick={fetchAll} sx={{ mt: 2 }}>
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 6, mb: 4, justifyContent: 'center' }}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, minWidth: 400, maxWidth: 500, flex: 1 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar src={getAvatarUrl(profile?.avatarUrl)} sx={{ width: 120, height: 120, mb: 2, boxShadow: 3, fontSize: 48 }} />
            <Button variant="outlined" component="label" sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}>
              Upload Photo
              <input type="file" hidden onChange={handlePhotoChange} />
            </Button>
          </Box>
          {editMode ? (
            <Box component="form" onSubmit={handleProfileUpdate}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={editProfile.bio || ''}
                onChange={handleProfileChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={editProfile.dateOfBirth || ''}
                onChange={handleProfileChange}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={editProfile.website || ''}
                onChange={handleProfileChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={editProfile.location || ''}
                onChange={handleProfileChange}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" sx={{ mr: 2 }}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {profile?.bio || 'Your Name'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {email || 'N/A'}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Bio</Typography></Grid>
                <Grid item xs={6}><Typography>{profile?.bio || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Date of Birth</Typography></Grid>
                <Grid item xs={6}><Typography>{profile?.dateOfBirth || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Website</Typography></Grid>
                <Grid item xs={6}><Typography>{profile?.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a> : 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Location</Typography></Grid>
                <Grid item xs={6}><Typography>{profile?.location || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Public Profile</Typography></Grid>
                <Grid item xs={6}><Typography>{profile?.isPublicProfile ? 'Yes' : 'No'}</Typography></Grid>
              </Grid>
              <Button variant="contained" sx={{ mt: 4, width: '100%', borderRadius: 2, fontWeight: 600, fontSize: 16, py: 1.5, boxShadow: 2 }} onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            </>
          )}
        </Paper>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, minWidth: 600, flex: 2 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Addresses
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Label</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addresses.map(address => (
                  <TableRow key={address.id}>
                    <TableCell>{address.type}</TableCell>
                    <TableCell>{address.label}</TableCell>
                    <TableCell>
                      {address.streetAddress}, {address.city}, {address.state}, {address.country} {address.postalCode}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleSetDefaultAddress(address.id)} color={address.isDefault ? 'primary' : 'default'} title="Set Default"><StarIcon /></IconButton>
                      <IconButton onClick={() => handleDeleteAddress(address.id)} color="error" title="Delete"><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            sx={{ mt: 3, borderRadius: 2, fontWeight: 600, fontSize: 16, py: 1.5, boxShadow: 2 }}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Address
          </Button>
          <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogContent>
              {addressError && <Box mb={2}><Typography color="error">{addressError}</Typography></Box>}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Type" name="type" value={newAddress.type} onChange={handleAddressChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Label" name="label" value={newAddress.label} onChange={handleAddressChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Street Address" name="streetAddress" value={newAddress.streetAddress} onChange={handleAddressChange} error={!!addressFieldErrors.streetAddress} helperText={addressFieldErrors.streetAddress} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="City" name="city" value={newAddress.city} onChange={handleAddressChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="State" name="state" value={newAddress.state} onChange={handleAddressChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Country" name="country" value={newAddress.country} onChange={handleAddressChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Postal Code" name="postalCode" value={newAddress.postalCode} onChange={handleAddressChange} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAddDialog(false)} color="secondary">Cancel</Button>
              <Button type="submit" variant="contained" onClick={handleAddAddress} disabled={addressLoading}>
                {addressLoading ? <CircularProgress size={24} /> : 'Add Address'}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile; 