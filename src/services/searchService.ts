import api from './api';
import { SearchFilters, SearchResponse, SuggestionResponse } from '../types';

class SearchService {
  /**
   * Basic product search
   */
  async searchProducts(filters: SearchFilters = {}): Promise<SearchResponse> {
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

      const response = await api.get(`/api/products?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Advanced search with Elasticsearch
   */
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

      const response = await api.get(`/api/products/search/advanced?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error performing advanced search:', error);
      throw new Error('Failed to perform advanced search');
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, category?: string): Promise<SuggestionResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      if (category) {
        queryParams.append('category', category);
      }

      const response = await api.get(`/api/products/search/suggestions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      throw new Error('Failed to get search suggestions');
    }
  }

  /**
   * Search by specification range
   */
  async searchBySpecificationRange(
    category: string,
    specKey: string,
    minValue: number,
    maxValue: number
  ): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('minValue', minValue.toString());
      queryParams.append('maxValue', maxValue.toString());

      const response = await api.get(
        `/api/products/categories/${category}/specs/${specKey}/range?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching by specification range:', error);
      throw new Error('Failed to search by specification range');
    }
  }

  /**
   * Fuzzy search with multiple fields
   */
  async fuzzySearch(query: string, options: {
    fields?: string[];
    fuzziness?: number;
    category?: string;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    try {
      const { fields = ['name', 'description', 'brand'], fuzziness = 2, category, limit = 20 } = options;
      
      const searchFilters: SearchFilters = {
        search: query,
        category,
        limit,
        includeAggregations: true
      };

      // Use advanced search for fuzzy matching
      return await this.advancedSearch(searchFilters);
    } catch (error) {
      console.error('Error performing fuzzy search:', error);
      throw new Error('Failed to perform fuzzy search');
    }
  }

  /**
   * Search with price range
   */
  async searchByPriceRange(minPrice: number, maxPrice: number, additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        minPrice,
        maxPrice,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching by price range:', error);
      throw new Error('Failed to search by price range');
    }
  }

  /**
   * Search by rating
   */
  async searchByRating(minRating: number, additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        minRating,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching by rating:', error);
      throw new Error('Failed to search by rating');
    }
  }

  /**
   * Search by brand
   */
  async searchByBrand(brand: string, additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        brand,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching by brand:', error);
      throw new Error('Failed to search by brand');
    }
  }

  /**
   * Search by specifications
   */
  async searchBySpecifications(specifications: Record<string, any>, additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        specifications,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching by specifications:', error);
      throw new Error('Failed to search by specifications');
    }
  }

  /**
   * Search by category-specific attributes
   */
  async searchByCategorySpecific(categorySpecific: Record<string, any>, additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        category_specific: categorySpecific,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching by category-specific attributes:', error);
      throw new Error('Failed to search by category-specific attributes');
    }
  }

  /**
   * Search in stock products only
   */
  async searchInStock(additionalFilters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        ...additionalFilters,
        inStock: true,
        includeAggregations: true
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error searching in-stock products:', error);
      throw new Error('Failed to search in-stock products');
    }
  }

  /**
   * Get search aggregations
   */
  async getSearchAggregations(filters: SearchFilters = {}): Promise<any> {
    try {
      const searchFilters: SearchFilters = {
        ...filters,
        includeAggregations: true,
        limit: 0 // Don't fetch products, only aggregations
      };

      const response = await this.advancedSearch(searchFilters);
      return response.aggregations;
    } catch (error) {
      console.error('Error getting search aggregations:', error);
      throw new Error('Failed to get search aggregations');
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(): Promise<string[]> {
    try {
      // This would typically come from analytics/backend
      // For now, return some common searches
      return [
        'laptop',
        'mobile phone',
        'refrigerator',
        'fan',
        'clothing'
      ];
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 10): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        limit,
        includeAggregations: false
      };

      return await this.advancedSearch(filters);
    } catch (error) {
      console.error('Error getting trending products:', error);
      throw new Error('Failed to get trending products');
    }
  }

  /**
   * Get recently viewed products
   */
  async getRecentlyViewedProducts(productIds: string[]): Promise<SearchResponse> {
    try {
      if (productIds.length === 0) {
        return { 
          products: [], 
          total: 0, 
          offset: 0, 
          limit: 0, 
          hasMore: false 
        };
      }

      // This would typically be handled by the backend
      // For now, we'll fetch products individually
      const products = await Promise.all(
        productIds.map(id => api.get(`/api/products/${id}`).then(res => res.data))
      );

      return {
        products,
        total: products.length,
        offset: 0,
        limit: products.length,
        hasMore: false
      };
    } catch (error) {
      console.error('Error getting recently viewed products:', error);
      throw new Error('Failed to get recently viewed products');
    }
  }

  /**
   * Search with multiple filters
   */
  async searchWithMultipleFilters(filters: {
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    specifications?: Record<string, any>;
    category_specific?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    try {
      const searchFilters: SearchFilters = {
        ...filters,
        includeAggregations: true
      };

      return await this.advancedSearch(searchFilters);
    } catch (error) {
      console.error('Error searching with multiple filters:', error);
      throw new Error('Failed to search with multiple filters');
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<any> {
    try {
      const response = await api.get('/api/products/debug/sample-documents?limit=1');
      return {
        totalProducts: response.data.count || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting search stats:', error);
      throw new Error('Failed to get search stats');
    }
  }
}

export default new SearchService(); 