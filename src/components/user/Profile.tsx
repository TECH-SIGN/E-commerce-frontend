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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { RootState } from '../../store';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

interface UserPreferences {
  newsletter: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

const Profile: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    isDefault: false,
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      setAddresses(response.data.addresses || []);
      setPreferences(response.data.preferences || null);
    } catch (error) {
      toast.error('Failed to fetch profile');
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/me/addresses', newAddress);
      toast.success('Address added successfully');
      fetchUserProfile();
      setNewAddress({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        isDefault: false,
      });
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handlePreferencesUpdate = async (updates: Partial<UserPreferences>) => {
    try {
      await api.put('/users/me/preferences', updates);
      toast.success('Preferences updated successfully');
      fetchUserProfile();
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  if (!profile) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Box>
                <Typography>
                  <strong>Name:</strong> {profile.firstName} {profile.lastName}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {profile.email}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {profile.phoneNumber || 'Not provided'}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Preferences
              </Typography>
              {preferences && (
                <Box>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handlePreferencesUpdate({
                        newsletter: !preferences.newsletter,
                      })
                    }
                    sx={{ mb: 1 }}
                  >
                    {preferences.newsletter
                      ? 'Unsubscribe from Newsletter'
                      : 'Subscribe to Newsletter'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handlePreferencesUpdate({
                        marketingEmails: !preferences.marketingEmails,
                      })
                    }
                  >
                    {preferences.marketingEmails
                      ? 'Opt out of Marketing Emails'
                      : 'Opt in to Marketing Emails'}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Addresses
              </Typography>
              <List>
                {addresses.map((address) => (
                  <React.Fragment key={address.id}>
                    <ListItem
                      secondaryAction={
                        <>
                          <IconButton edge="end" aria-label="edit">
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete">
                            <DeleteIcon />
                          </IconButton>
                        </>
                      }
                    >
                      <ListItemText
                        primary={`${address.street}, ${address.city}`}
                        secondary={`${address.state}, ${address.country} ${address.zipCode}${
                          address.isDefault ? ' (Default)' : ''
                        }`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>

              <Box component="form" onSubmit={handleAddressSubmit} sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Add New Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street"
                      name="street"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          street: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          city: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State"
                      name="state"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          state: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          country: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ZIP Code"
                      name="zipCode"
                      value={newAddress.zipCode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          zipCode: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Add Address
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile; 