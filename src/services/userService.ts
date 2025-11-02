import api from './api';

// Types
export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  website?: string;
  location?: string;
  isPublicProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'billing' | 'shipping';
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  label?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UserStats {
  totalAddresses: number;
  totalActivities: number;
  profileCompleteness: number;
  lastActivityDate?: string;
  memberSince: string;
}

export interface CompleteUserProfile {
  profile: UserProfile;
  addresses: UserAddress[];
  stats: UserStats;
  recentActivities: UserActivity[];
}

export interface ProfileUpdateData {
  bio?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  website?: string;
  location?: string;
  isPublicProfile?: boolean;
}

export interface AddressData {
  type: 'home' | 'work' | 'billing' | 'shipping';
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
  label?: string;
}

class UserService {
  private baseURL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3011';

  async getCompleteProfile(): Promise<CompleteUserProfile> {
    try {
      const response = await api.get(`${this.baseURL}/api/users/profile/complete`);
      // Defensive: ensure all keys exist
      const data = response.data.data || response.data || {};
      return {
        profile: data.profile || null,
        addresses: data.addresses || [],
        stats: data.stats || {},
        recentActivities: data.recentActivities || []
      };
    } catch (error) {
      console.error('Error fetching complete profile:', error);
      throw new Error('Failed to fetch complete profile');
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get(`${this.baseURL}/api/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await api.put(`${this.baseURL}/api/users/profile`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  async getAddresses(): Promise<UserAddress[]> {
    try {
      const response = await api.get(`${this.baseURL}/api/users/addresses`);
      // Debug log
      console.log('API getAddresses response:', response.data);
      // Handle both array and object response
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw new Error('Failed to fetch addresses');
    }
  }

  async addAddress(data: AddressData): Promise<UserAddress> {
    try {
      const response = await api.post(`${this.baseURL}/api/users/addresses`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error('Failed to add address');
    }
  }

  async updateAddress(addressId: string, data: AddressData): Promise<UserAddress> {
    try {
      const response = await api.put(`${this.baseURL}/api/users/addresses/${addressId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Failed to update address');
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/api/users/addresses/${addressId}`);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('Failed to delete address');
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      await api.put(`${this.baseURL}/api/users/addresses/${addressId}/default`);
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('Failed to set default address');
    }
  }

  async getActivityLogs(limit: number = 10): Promise<UserActivity[]> {
    try {
      const response = await api.get(`${this.baseURL}/api/users/activity?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw new Error('Failed to fetch activity logs');
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get(`${this.baseURL}/api/users/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }
  }
}

export default new UserService();
