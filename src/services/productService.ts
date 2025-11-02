import api from './api';
import { 
  Product, 
  SearchFilters, 
  SearchResponse, 
  SuggestionResponse,
  CategorySpecs 
} from '../types';

class ProductService {
  // Controllers to cancel in-flight requests per endpoint
  private productsController?: AbortController;
  private advancedController?: AbortController;
  private suggestController?: AbortController;

  // Simple in-memory cache for suggestions (category+query) with TTL
  private suggestionCache: Map<string, { ts: number; data: SuggestionResponse }> = new Map();
  private suggestionTTL = 2 * 60 * 1000; // 2 minutes
  // Basic CRUD operations
  async getProducts(filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      console.log('🌐 productService.getProducts called with filters:', filters);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      // Optimize aggregations for performance: disable on pages after the first
      if (filters.offset && filters.offset > 0) {
        queryParams.append('includeAggregations', 'false');
      }

      const url = `/api/products?${queryParams}`;
      console.log('🌐 Making API call to:', url);
      // cancel previous and create new controller
      if (this.productsController) {
        try { this.productsController.abort(); } catch {}
      }
      this.productsController = new AbortController();
      const response = await api.get(url, { signal: this.productsController.signal });
      console.log('✅ API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  // Role-based product fetching for admin management
  async getAdminProducts(filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      console.log('🔐 productService.getAdminProducts called with filters:', filters);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      // Optimize aggregations for performance: disable on pages after the first
      if (filters.offset && filters.offset > 0) {
        queryParams.append('includeAggregations', 'false');
      }

      // Admin endpoint - shows all products for management
      const url = `/api/products?${queryParams}`;
      console.log('🔐 Making admin API call to:', url);
      
      const response = await api.get(url);
      console.log('✅ Admin API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching admin products:', error);
      throw new Error('Failed to fetch admin products');
    }
  }

  // User-specific products (for regular users)
  async getUserProducts(filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      console.log('👤 productService.getUserProducts called with filters:', filters);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      // Optimize aggregations for performance: disable on pages after the first
      if (filters.offset && filters.offset > 0) {
        queryParams.append('includeAggregations', 'false');
      }

      // User-specific endpoint - shows only user's own products
      const url = `/api/products/mine?${queryParams}`;
      console.log('👤 Making user API call to:', url);
      // cancel previous and create new controller
      if (this.productsController) {
        try { this.productsController.abort(); } catch {}
      }
      this.productsController = new AbortController();
      const response = await api.get(url, {
        signal: this.productsController.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      console.log('✅ User API response:', response.data);
      
      return response.data;
    } catch (error: any) {
      // Ignore log noise for intentionally canceled requests (AbortController)
      if (error?.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('❌ Error fetching user products:', error);
      throw new Error('Failed to fetch user products');
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await api.get(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  async createProduct(productData: FormData): Promise<Product> {
    try {
      const response = await api.post('/api/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(id: string, productData: FormData): Promise<Product> {
    try {
      const response = await api.put(`/api/products/${id}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`/api/products/${id}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  // Advanced search operations with enhanced features
  async advancedSearch(filters: SearchFilters): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      // Optimize aggregations for performance: disable on pages after the first
      if (filters.offset && filters.offset > 0) {
        queryParams.append('includeAggregations', 'false');
      }

      // Pre-fill q with a lowercased first token for improved backend scoring (backward compatible)
      if ((filters as any).search && typeof (filters as any).search === 'string') {
        const firstToken = String((filters as any).search).trim().split(/\s+/)[0]?.toLowerCase();
        if (firstToken) {
          queryParams.append('q', firstToken);
        }
      }

      const url = `/api/products/search/advanced?${queryParams}`;
      console.log('🔍 Making advanced search API call to:', url);
      // cancel previous and create new controller
      if (this.advancedController) {
        try { this.advancedController.abort(); } catch {}
      }
      this.advancedController = new AbortController();
      const response = await api.get(url, { signal: this.advancedController.signal });
      console.log('✅ Advanced search response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error in advanced search:', error);
      throw new Error('Failed to perform advanced search');
    }
  }

  async getSearchSuggestions(query: string, category?: string): Promise<SuggestionResponse> {
    try {
      const q = (query || '').trim();
      const params = new URLSearchParams({ query: q });
      if (category) {
        params.append('category', category);
      }
      const cacheKey = `${category || ''}::${q}`;
      const now = Date.now();
      const cached = this.suggestionCache.get(cacheKey);
      if (cached && now - cached.ts < this.suggestionTTL) {
        return cached.data;
      }

      // cancel previous and create new controller
      if (this.suggestController) {
        try { this.suggestController.abort(); } catch {}
      }
      this.suggestController = new AbortController();
      const response = await api.get(`/api/products/search/suggestions?${params}`, { signal: this.suggestController.signal });
      const data = response.data as SuggestionResponse;
      this.suggestionCache.set(cacheKey, { ts: now, data });
      return data;
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      throw new Error('Failed to fetch search suggestions');
    }
  }

  async getAllCategorySpecs(): Promise<{ categories: CategorySpecs[] }> {
    try {
      const response = await api.get('/api/products/categories/specs');
      return response.data;
    } catch (error) {
      console.error('Error fetching category specs:', error);
      throw new Error('Failed to fetch category specifications');
    }
  }

  async getCategorySpecs(category: string): Promise<CategorySpecs> {
    try {
      const response = await api.get(`/api/products/categories/${category}/specs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category specs:', error);
      throw new Error('Failed to fetch category specifications');
    }
  }

  async searchBySpecificationRange(
    category: string,
    specKey: string,
    minValue: number,
    maxValue: number
  ): Promise<Product[]> {
    try {
      const response = await api.get(
        `/api/products/categories/${category}/specs/${specKey}/range?min=${minValue}&max=${maxValue}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching by specification range:', error);
      throw new Error('Failed to search by specification range');
    }
  }

  // Legacy method - kept for backward compatibility
  async getMyProducts(filters: SearchFilters = {}): Promise<SearchResponse> {
    console.warn('⚠️ getMyProducts is deprecated. Use getUserProducts for user-specific products or getAdminProducts for admin management.');
    return this.getUserProducts(filters);
  }

  async updateProductStatus(id: string, status: 'active' | 'inactive'): Promise<Product> {
    try {
      const response = await api.patch(`/api/products/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating product status:', error);
      throw new Error('Failed to update product status');
    }
  }

  async updateProductStock(id: string, stock: number): Promise<Product> {
    try {
      const response = await api.patch(`/api/products/${id}/stock`, { stock });
      return response.data;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw new Error('Failed to update product stock');
    }
  }

  async bulkUpdateProducts(updates: Array<{ id: string; [key: string]: any }>): Promise<void> {
    try {
      await api.post('/api/products/bulk', { updates });
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw new Error('Failed to bulk update products');
    }
  }

  async getSampleDocuments(limit: number = 5): Promise<{ documents: Product[]; count: number; limit: number }> {
    try {
      const response = await api.get(`/api/products/debug/sample-documents?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sample documents:', error);
      throw new Error('Failed to fetch sample documents');
    }
  }

  async bulkIndexProducts(): Promise<{ message: string; count: number }> {
    try {
      const response = await api.post('/api/products/bulk-index');
      return response.data;
    } catch (error) {
      console.error('Error bulk indexing products:', error);
      throw new Error('Failed to bulk index products');
    }
  }
}

export default new ProductService(); 