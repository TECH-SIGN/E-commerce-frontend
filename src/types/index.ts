// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API related types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
} 