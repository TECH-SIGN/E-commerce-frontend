import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import productService from '../../services/productService';
import { Product, SearchFilters, SearchResponse, SuggestionResponse, CategorySpecs } from '../../types';

// Async thunks for role-based product fetching
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: SearchFilters = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAdminProducts = createAsyncThunk(
  'products/fetchAdminProducts',
  async (filters: SearchFilters = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getAdminProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProducts = createAsyncThunk(
  'products/fetchUserProducts',
  async (filters: SearchFilters = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getUserProducts(filters);
      return response;
    } catch (error: any) {
      // Treat AbortController cancellations as silent (no UI error)
      if (error?.code === 'ERR_CANCELED') {
        return rejectWithValue({ canceled: true });
      }
      return rejectWithValue(error.message);
    }
  }
);

// Legacy thunk - kept for backward compatibility
export const fetchMyProducts = createAsyncThunk(
  'products/fetchMyProducts',
  async (filters: SearchFilters = {}, { rejectWithValue }) => {
    try {
      console.warn('⚠️ fetchMyProducts is deprecated. Use fetchUserProducts for user-specific products or fetchAdminProducts for admin management.');
      const response = await productService.getUserProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const advancedSearch = createAsyncThunk(
  'products/advancedSearch',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      const response = await productService.advancedSearch(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getSearchSuggestions = createAsyncThunk(
  'products/getSearchSuggestions',
  async ({ query, category }: { query: string; category?: string }, { rejectWithValue }) => {
    try {
      const response = await productService.getSearchSuggestions(query, category);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAllCategorySpecs = createAsyncThunk(
  'products/getAllCategorySpecs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getAllCategorySpecs();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCategorySpecs = createAsyncThunk(
  'products/getCategorySpecs',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await productService.getCategorySpecs(category);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: FormData) => {
    return await productService.createProduct(productData);
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }: { id: string; productData: FormData }) => {
    return await productService.updateProduct(id, productData);
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string) => {
    await productService.deleteProduct(id);
    return id;
  }
);

export const updateProductStatus = createAsyncThunk(
  'products/updateProductStatus',
  async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
    return await productService.updateProductStatus(id, status);
  }
);

export const updateProductStock = createAsyncThunk(
  'products/updateProductStock',
  async ({ id, stock }: { id: string; stock: number }) => {
    return await productService.updateProductStock(id, stock);
  }
);

export const bulkUpdateProducts = createAsyncThunk(
  'products/bulkUpdateProducts',
  async (updates: Array<{ id: string; [key: string]: any }>) => {
    await productService.bulkUpdateProducts(updates);
    return updates;
  }
);

export const getSampleDocuments = createAsyncThunk(
  'products/getSampleDocuments',
  async (limit: number = 5) => {
    return await productService.getSampleDocuments(limit);
  }
);

export const bulkIndexProducts = createAsyncThunk(
  'products/bulkIndexProducts',
  async () => {
    return await productService.bulkIndexProducts();
  }
);

// State interface
interface ProductState {
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
  // New: Enhanced pagination and performance metrics
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  useElastic?: boolean;
  es_took?: number;
  es_timed_out?: boolean;
}

// Initial state
const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  searchResults: [],
  suggestions: [],
  categorySpecs: [],
  currentCategorySpecs: null,
  total: 0,
  offset: 0,
  limit: 10,
  filters: {},
  aggregations: {},
  loading: false,
  searchLoading: false,
  suggestionsLoading: false,
  error: null,
  searchError: null,
  suggestionsError: null,
  isAdvancedSearch: false,
  fallbackUsed: false,
  // New: Enhanced pagination and performance metrics
  hasMore: false,
  cursor: undefined,
  nextCursor: undefined,
  useElastic: undefined,
  es_took: undefined,
  es_timed_out: undefined,
};

// Slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.suggestions = [];
      state.isAdvancedSearch = false;
      state.fallbackUsed = false;
      // Reset enhanced pagination and performance metrics
      state.hasMore = false;
      state.cursor = undefined;
      state.nextCursor = undefined;
      state.useElastic = undefined;
      state.es_took = undefined;
      state.es_timed_out = undefined;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.suggestionsError = null;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
      state.suggestionsError = null;
    },
    setOffset: (state, action: PayloadAction<number>) => {
      state.offset = action.payload;
    },
    setCursor: (state, action: PayloadAction<string>) => {
      state.cursor = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Public products fetching (for store display)
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        const isCursor = (action as any).meta?.arg?.cursor;
        if (isCursor) {
          state.products = [...state.products, ...action.payload.products];
        } else {
          state.products = action.payload.products;
        }
        state.total = action.payload.total;
        state.offset = action.payload.offset || 0;
        state.limit = action.payload.limit;
        state.hasMore = action.payload.hasMore;
        state.cursor = action.payload.cursor;
        state.nextCursor = action.payload.nextCursor;
        state.useElastic = action.payload.useElastic;
        state.es_took = action.payload.es_took;
        state.es_timed_out = action.payload.es_timed_out;
        state.aggregations = action.payload.aggregations || {};
        state.fallbackUsed = action.payload.fallback || false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Admin products fetching (for admin management)
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        const isCursor = (action as any).meta?.arg?.cursor;
        if (isCursor) {
          state.products = [...state.products, ...action.payload.products];
        } else {
          state.products = action.payload.products;
        }
        state.total = action.payload.total;
        state.offset = action.payload.offset || 0;
        state.limit = action.payload.limit;
        state.hasMore = action.payload.hasMore;
        state.cursor = action.payload.cursor;
        state.nextCursor = action.payload.nextCursor;
        state.useElastic = action.payload.useElastic;
        state.es_took = action.payload.es_took;
        state.es_timed_out = action.payload.es_timed_out;
        state.aggregations = action.payload.aggregations || {};
        state.fallbackUsed = action.payload.fallback || false;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

// User products fetching (for user's own products)
builder
.addCase(fetchUserProducts.pending, (state) => {
state.loading = true;
state.error = null;
})
.addCase(fetchUserProducts.fulfilled, (state, action) => {
state.loading = false;
const isCursor = (action as any).meta?.arg?.cursor;
if (isCursor) {
state.products = [...state.products, ...action.payload.products];
} else {
state.products = action.payload.products;
}
state.total = action.payload.total;
state.offset = action.payload.offset || 0;
state.limit = action.payload.limit;
state.hasMore = action.payload.hasMore;
state.cursor = action.payload.cursor;
state.nextCursor = action.payload.nextCursor;
state.useElastic = action.payload.useElastic;
state.es_took = action.payload.es_took;
state.es_timed_out = action.payload.es_timed_out;
state.aggregations = action.payload.aggregations || {};
state.fallbackUsed = action.payload.fallback || false;
})
.addCase(fetchUserProducts.rejected, (state, action) => {
 state.loading = false;
 // Ignore silent cancellations
 const payload: any = action.payload;
 if (payload && payload.canceled) {
   return;
 }
 state.error = action.payload as string;
});

// Legacy fetchMyProducts (for backward compatibility)
builder
.addCase(fetchMyProducts.pending, (state) => {
 state.loading = true;
 state.error = null;
})
.addCase(fetchMyProducts.fulfilled, (state, action) => {
state.loading = false;
const isCursor = (action as any).meta?.arg?.cursor;
if (isCursor) {
state.products = [...state.products, ...action.payload.products];
} else {
state.products = action.payload.products;
}
state.total = action.payload.total;
state.offset = action.payload.offset || 0;
state.limit = action.payload.limit;
state.hasMore = action.payload.hasMore;
state.cursor = action.payload.cursor;
state.nextCursor = action.payload.nextCursor;
state.useElastic = action.payload.useElastic;
state.es_took = action.payload.es_took;
state.es_timed_out = action.payload.es_timed_out;
state.aggregations = action.payload.aggregations || {};
state.fallbackUsed = action.payload.fallback || false;
})
.addCase(fetchMyProducts.rejected, (state, action) => {
state.loading = false;
state.error = action.payload as string;
});

// Product by ID
builder
.addCase(fetchProductById.pending, (state) => {
state.loading = true;
state.error = null;
})
.addCase(fetchProductById.fulfilled, (state, action) => {
state.loading = false;
state.selectedProduct = action.payload;
})
.addCase(fetchProductById.rejected, (state, action) => {
state.loading = false;
state.error = action.payload as string;
});

// Advanced search
builder
.addCase(advancedSearch.pending, (state) => {
state.searchLoading = true;
state.searchError = null;
state.isAdvancedSearch = true;
})
.addCase(advancedSearch.fulfilled, (state, action) => {
state.searchLoading = false;
const isCursor = (action as any).meta?.arg?.cursor;
if (isCursor) {
state.searchResults = [...state.searchResults, ...action.payload.products];
} else {
state.searchResults = action.payload.products;
}
state.total = action.payload.total;
state.offset = action.payload.offset || 0;
state.limit = action.payload.limit;
state.hasMore = action.payload.hasMore;
state.cursor = action.payload.cursor;
state.nextCursor = action.payload.nextCursor;
state.useElastic = action.payload.useElastic;
state.es_took = action.payload.es_took;
state.es_timed_out = action.payload.es_timed_out;
state.aggregations = action.payload.aggregations || {};
state.fallbackUsed = action.payload.fallback || false;
})
.addCase(advancedSearch.rejected, (state, action) => {
state.searchLoading = false;
state.searchError = action.payload as string;
});

// Search suggestions
builder
  .addCase(getSearchSuggestions.pending, (state) => {
    state.suggestionsLoading = true;
    state.suggestionsError = null;
  })
  .addCase(getSearchSuggestions.fulfilled, (state, action) => {
    state.suggestionsLoading = false;
    state.suggestions = action.payload.suggestions;
  })
  .addCase(getSearchSuggestions.rejected, (state, action) => {
    state.suggestionsLoading = false;
    state.suggestionsError = action.payload as string;
  });

    // Category specs
    builder
      .addCase(getAllCategorySpecs.fulfilled, (state, action) => {
        state.categorySpecs = action.payload.categories;
      })
      .addCase(getCategorySpecs.fulfilled, (state, action) => {
        state.currentCategorySpecs = action.payload;
      });

    // createProduct
    builder
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.products.unshift(action.payload);
        state.total += 1;
      });

    // updateProduct
    builder
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      });

    // deleteProduct
    builder
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.products = state.products.filter(p => p.id !== action.payload);
        state.total -= 1;
        if (state.selectedProduct?.id === action.payload) {
          state.selectedProduct = null;
        }
      });
  },
});

export const { 
  clearSearchResults, 
  clearSuggestions, 
  setFilters, 
  clearFilters, 
  setSelectedProduct, 
  clearError, 
  setOffset, 
  setCursor 
} = productSlice.actions;

export default productSlice.reducer; 