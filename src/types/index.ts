// Product related types
export interface Variant {
  id?: string;
  color?: string;
  size?: string;
  sku?: string;
  price?: number; // optional override
  stock: number;
  active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  sku: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
  tags?: string[];
  status: 'active' | 'inactive' | 'published';
  meta_title?: string;
  meta_description?: string;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  specifications?: Record<string, any>;
  search_keywords?: string;
  category_specific?: Record<string, any>;
  // Variant facets (from Elasticsearch doc)
  variant_colors?: string[];
  variant_sizes?: string[];
  min_variant_price?: number;
  max_variant_price?: number;
  variant_in_stock?: boolean;
  // Structured variants
  variants?: Variant[];
  // New: Search-specific fields
  score?: number;
  source?: 'db' | 'es';
  _score?: number;
  _id?: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  search?: string;
  specifications?: Record<string, any>;
  category_specific?: Record<string, any>;
  specification_ranges?: Record<string, { min: number; max: number }>;
  includeAggregations?: boolean;
  offset?: number;
  limit?: number;
  cursor?: string; // New: Support for cursor-based pagination
  // Variant-aware filters
  colors?: string[];
  sizes?: string[];
  variantInStock?: boolean;
  minVariantPrice?: number;
  maxVariantPrice?: number;
}

export interface SearchResponse {
  products: Product[];
  total: number;
  offset?: number;
  limit: number;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  aggregations?: Record<string, any>;
  fallback?: boolean;
  useElastic?: boolean;
  // New: Enhanced performance metrics
  es_took?: number;
  es_timed_out?: boolean;
  es_shards?: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface SuggestionResponse {
  suggestions: Array<{
    name: string;
    brand: string;
    category: string;
  }>;
  query: string;
  category?: string;
  fallback?: boolean;
}

export interface CategorySpecs {
  category: string;
  name: string; // Add the missing name property
  specifications: Record<string, any>;
  filters: Record<string, any>;
  required: string[];
  optional: string[];
  searchable: string[];
}

// Additional types for the application
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'store';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  // Computed property for full name
  name?: string;
  // Two-factor authentication
  twoFactorEnabled?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  product: Product;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  products: Product[];
  total: number;
  aggregations?: Record<string, any>;
  suggestions?: string[];
}

export interface AdminProductAction {
  type: 'edit' | 'delete' | 'toggle-status' | 'update-stock';
  productId: string;
  data?: any;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  sku: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  specifications?: Record<string, any>;
  category_specific?: Record<string, any>;
  images?: File[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: ValidationError[];
}

// Redux state types
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  total: number;
}

export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  searchResults: Product[];
  suggestions: SuggestionResponse['suggestions'];
  categorySpecs: CategorySpecs[];
  currentCategorySpecs: CategorySpecs | null;
  total: number;
  offset: number;
  limit: number;
  filters: SearchFilters;
  aggregations: Record<string, any>;
  loading: boolean;
  searchLoading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  searchError: string | null;
  suggestionsError: string | null;
  isAdvancedSearch: boolean;
  fallbackUsed: boolean;
}

export interface RootState {
  auth: AuthState;
  cart: CartState;
  products: ProductState;
} 