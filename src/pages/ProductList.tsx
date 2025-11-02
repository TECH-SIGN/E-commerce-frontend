import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  CircularProgress,
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Autocomplete,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Divider,
  Rating,
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormGroup,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  LocalOffer as LocalOfferIcon,
  Speed as SpeedIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { SearchFilters } from '../types';
import { 
  fetchProducts, 
  advancedSearch, 
  getSearchSuggestions,
  getAllCategorySpecs,
  clearSearchResults
} from '../store/slices/productSlice';
import { debounce } from '../utils/debounce';
import SearchPerformanceMonitor from '../components/SearchPerformanceMonitor';

const ProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    products, 
    searchResults,
    total, 
    loading, 
    searchLoading,
    error, 
    searchError,
    suggestions, 
    suggestionsLoading,
    categorySpecs,
    aggregations,
    isAdvancedSearch,
    fallbackUsed,
    useElastic,
    es_took,
    es_timed_out
  } = useSelector((state: RootState) => state.products);

  // State management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minRating: 0,
    inStock: undefined, // Changed from false to undefined to show all products
    // Variant-aware filters
    colors: [] as string[],
    sizes: [] as string[],
    variantInStock: undefined as boolean | undefined,
    minVariantPrice: undefined as number | undefined,
    maxVariantPrice: undefined as number | undefined,
    specifications: {} as Record<string, any>,
    category_specific: {} as Record<string, any>
  });

  // Refs to avoid duplicate dispatches and race conditions
  const lastSuggestQueryRef = useRef<string>('');
  const lastSearchKeyRef = useRef<string>('');
  const prevSearchTermRef = useRef<string>('');
  // Track previous filters to avoid duplicate fetches when resetting page to 1
  const prevFiltersKeyRef = useRef<string>('');

  // Enhanced debounced search function with better performance
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      const q = (query || '').trim();
      if (q.length < 2) return;
      // distinct-until-changed per category
      const key = `${selectedCategory}::${q}`;
      if (lastSuggestQueryRef.current === key) return;
      lastSuggestQueryRef.current = key;
      dispatch(getSearchSuggestions({ query: q, category: selectedCategory }));
    }, 300, { maxWait: 1000 }),
    [dispatch, selectedCategory]
  );

  // Debounced main search function to prevent API spam
  const debouncedMainSearch = useMemo(
    () => debounce(async (term: string, f: SearchFilters) => {
      try {
        const q = (term || '').trim();
        const searchFilters: SearchFilters = {
          ...f,
          offset: (page - 1) * pageSize,
          limit: pageSize,
          includeAggregations: page === 1
        };

        // build a compact key to avoid duplicate dispatches for identical queries/filters/page
        const key = JSON.stringify({
          q,
          c: f.category || '',
          b: f.brand || '',
          min: f.minPrice ?? null,
          max: f.maxPrice ?? null,
          st: f.inStock ?? null,
          p: page,
          s: pageSize
        });
        if (lastSearchKeyRef.current === key) return;
        lastSearchKeyRef.current = key;

        if (q.length > 0) {
          await dispatch(advancedSearch({ ...searchFilters, search: q }));
        } else {
          dispatch(clearSearchResults());
          await dispatch(fetchProducts(searchFilters));
        }
      } catch (err) {
        console.error('Error in debounced search:', err);
      }
    }, 500, { maxWait: 1200 }),
    [dispatch, page, pageSize]
  );

  // Cursor-based Load More has been removed; using offset pagination only

  // Load category specifications on mount
  useEffect(() => {
    dispatch(getAllCategorySpecs());
  }, [dispatch]);

  // Enhanced product fetching with cursor support
  const fetchProductsData = async () => {
    try {
      console.log('🔄 Fetching products with filters:', filters);
      const searchFilters: SearchFilters = {
        ...filters,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        includeAggregations: page === 1 // Only include aggregations on first page
      };

      if (searchTerm) {
        searchFilters.search = searchTerm;
        await dispatch(advancedSearch(searchFilters));
      } else {
        // Ensure we are not stuck in advanced search mode
        dispatch(clearSearchResults());
        await dispatch(fetchProducts(searchFilters));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch products when dependencies change, with guard to prevent double fetches on filter change
  useEffect(() => {
    const currentFiltersKey = JSON.stringify(filters);
    const filtersChanged = prevFiltersKeyRef.current !== currentFiltersKey;

    if (filtersChanged) {
      prevFiltersKeyRef.current = currentFiltersKey;
      // Clear search results to ensure consistent UI state
      dispatch(clearSearchResults());
      // If filters changed and we're not on page 1, reset page first and skip this fetch
      if (page !== 1) {
        setPage(1);
        return;
      }
      // If already on page 1, proceed to fetch below
    }

    fetchProductsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]); // Do not include fetchProductsData to keep stable deps

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      debouncedMainSearch.cancel();
    };
  }, [debouncedSearch, debouncedMainSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSpecificationChange = (specKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specKey]: value
      }
    }));
  };

  const handleCategorySpecificChange = (specKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      category_specific: {
        ...prev.category_specific,
        [specKey]: value
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: 0,
      inStock: undefined, // Changed from false to undefined to show all products
      // Variant-aware filters
      colors: [],
      sizes: [],
      variantInStock: undefined,
      minVariantPrice: undefined,
      maxVariantPrice: undefined,
      specifications: {},
      category_specific: {}
    });
    setSearchTerm('');
    setSelectedCategory('');
    // Make sure UI switches back to regular products list
    dispatch(clearSearchResults());
    // Trigger search to show all products immediately
    debouncedMainSearch('', {
      category: '',
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: 0,
      inStock: undefined,
      colors: [],
      sizes: [],
      variantInStock: undefined,
      minVariantPrice: undefined,
      maxVariantPrice: undefined,
      specifications: {},
      category_specific: {}
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const trimmed = (value || '').trim();
    setSearchTerm(value);
    // If the search term actually changed (distinct), reset to first page and allow new dispatch key
    if (prevSearchTermRef.current !== trimmed) {
      setPage(1);
      lastSearchKeyRef.current = '';
      prevSearchTermRef.current = trimmed;
    }
    
    // Debounced search for suggestions
    debouncedSearch(value);
    
    // Debounced main search to prevent API spam
    debouncedMainSearch(value, filters);
    // If search is cleared, immediately switch to regular list
    if (!value || value.trim().length === 0) {
      dispatch(clearSearchResults());
    }
  };

  // Manual search function (for search button)
  const handleManualSearch = () => {
    if (searchTerm && searchTerm.trim().length > 0) {
      // prevent duplicate from pending debounce
      debouncedSearch.cancel();
      debouncedMainSearch.cancel();
      // Perform immediate search without debouncing
      const searchFilters: SearchFilters = {
        ...filters,
        offset: 0, // Reset to first page
        limit: pageSize,
        search: searchTerm.trim(),
        includeAggregations: true
      };
      dispatch(advancedSearch(searchFilters));
      setPage(1); // Reset to first page
    } else {
      // If search term is empty, show all products
      const searchFilters: SearchFilters = {
        ...filters,
        offset: 0,
        limit: pageSize,
        includeAggregations: true
      };
      // Ensure state reflects non-advanced search
      debouncedSearch.cancel();
      debouncedMainSearch.cancel();
      dispatch(clearSearchResults());
      dispatch(fetchProducts(searchFilters));
      setPage(1);
    }
  };

  // Handle Enter key press in search field
  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      debouncedSearch.cancel();
      debouncedMainSearch.cancel();
      handleManualSearch();
    }
  };

  const handleCategoryChange = (event: any) => {
    const value = event.target.value;
    setSelectedCategory(value);
    handleFilterChange('category', value);
    // reset suggestion distinct key when category changes
    lastSuggestQueryRef.current = '';
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    // allow fresh search dispatch for new page size
    lastSearchKeyRef.current = '';
  };

  const pageSizeOptions = [6, 12, 18, 24, 30, 36];

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchTerm(suggestion.name);
    handleFilterChange('category', suggestion.category);
    setSelectedCategory(suggestion.category);
  };

  // Handle price filter changes with proper type conversion
  const handlePriceChange = (type: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleFilterChange(type, numValue);
  };

  // Get current products (either search results or regular products)
  const currentProducts = isAdvancedSearch ? searchResults : products;
  const currentLoading = isAdvancedSearch ? searchLoading : loading;
  const currentError = isAdvancedSearch ? searchError : error;

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor
        useElastic={useElastic}
        es_took={es_took}
        es_timed_out={es_timed_out}
        fallbackUsed={fallbackUsed}
        resultCount={currentProducts.length}
        total={total}
      />

      {/* Search and Filters (Sticky) */}
      <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, boxShadow: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {suggestionsLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <IconButton
                        onClick={handleManualSearch}
                        size="small"
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                        }}
                      >
                        <SearchIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            {/* Search Suggestions */}
            {suggestions.length > 0 && searchTerm && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {suggestions.map((suggestion, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <Typography variant="body2">{suggestion.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {suggestion.brand} • {suggestion.category}
          </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Grid>
              <Grid item xs={12} md={6}>
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categorySpecs.map((spec) => (
                    <MenuItem key={spec.category} value={spec.category}>
                      {spec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearAllFilters}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Min Price"
                  type="number"
                  value={filters.minPrice === undefined ? '' : filters.minPrice}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Max Price"
                  type="number"
                  value={filters.maxPrice === undefined ? '' : filters.maxPrice}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Brand"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    />
                  }
                  label="In Stock Only"
                />
              </Grid>

              {/* Variant-aware filters */}
              <Grid item xs={12} md={3}>
                <Autocomplete
                  multiple
                  options={(aggregations?.variant_colors?.buckets || []).map((b: any) => b.key)}
                  value={filters.colors || []}
                  onChange={(_, value) => handleFilterChange('colors', value)}
                  freeSolo
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Variant Colors" placeholder="Add color" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  multiple
                  options={(aggregations?.variant_sizes?.buckets || []).map((b: any) => b.key)}
                  value={filters.sizes || []}
                  onChange={(_, value) => handleFilterChange('sizes', value)}
                  freeSolo
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Variant Sizes" placeholder="Add size" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Min Variant Price"
                  type="number"
                  value={filters.minVariantPrice === undefined ? '' : filters.minVariantPrice}
                  onChange={(e) => handleFilterChange('minVariantPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Max Variant Price"
                  type="number"
                  value={filters.maxVariantPrice === undefined ? '' : filters.maxVariantPrice}
                  onChange={(e) => handleFilterChange('maxVariantPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!filters.variantInStock}
                      onChange={(e) => handleFilterChange('variantInStock', e.target.checked)}
                    />
                  }
                  label="In-stock Variants Only"
                />
              </Grid>

              {/* Laptop-specific: Screen Size (category-specific spec) */}
              {selectedCategory === 'laptop' && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={
                      // Try multiple common aggregation keys for screen size
                      (aggregations?.screen_size?.buckets ||
                       aggregations?.category_specific?.screen_size?.buckets ||
                       aggregations?.specifications?.screen_size?.buckets ||
                       [])
                        .map((b: any) => b.key)
                    }
                    value={(filters.category_specific?.screen_size as string[]) || []}
                    onChange={(_, value) => handleCategorySpecificChange('screen_size', value)}
                    freeSolo
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Screen Size (Laptop)" placeholder={'e.g., 13" 15.6" 17"'} />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}
          </Paper>

      {/* Loading Indicator */}
      {currentLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Error Display */}
      {currentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {currentError}
        </Alert>
      )}

      {/* Products Grid or Skeletons */}
      {currentLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: pageSize }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${idx}`}>
              <Card elevation={1}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={28} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {currentProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => window.location.href = `/products/${product.id}`}
              >
                {/* Search Score Badge */}
                {product.score && (
                  <Badge
                    badgeContent={`${(product.score * 100).toFixed(0)}%`}
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1
                    }}
                  >
                    <Box />
                  </Badge>
                )}

                <CardMedia
                  component="img"
                  height="200"
                  image={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.brand} • {product.category}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <Rating value={product.rating} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({product.review_count})
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    ${product.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stock}
                  </Typography>
                  {/* Variant badges: colors, sizes, and laptop screen sizes */}
                  {(product.variant_colors?.length || product.variant_sizes?.length || (product.category === 'laptop' && (product.category_specific as any)?.screen_size)) && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {/* Colors */}
                      {product.variant_colors?.length ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">Colors:</Typography>
                          {product.variant_colors.slice(0, 4).map((c) => (
                            <Chip key={c} label={c} size="small" variant="outlined" />
                          ))}
                          {product.variant_colors.length > 4 && (
                            <Chip label={`+${product.variant_colors.length - 4}`} size="small" />
                          )}
                        </Box>
                      ) : null}
                      {/* Sizes (e.g., clothing) */}
                      {product.variant_sizes?.length ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">Sizes:</Typography>
                          {product.variant_sizes.slice(0, 4).map((s) => (
                            <Chip key={s} label={s} size="small" variant="outlined" />
                          ))}
                          {product.variant_sizes.length > 4 && (
                            <Chip label={`+${product.variant_sizes.length - 4}`} size="small" />
                          )}
                        </Box>
                      ) : null}
                      {/* Laptop screen sizes from category_specific */}
                      {product.category === 'laptop' && (product.category_specific as any)?.screen_size ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">Screen:</Typography>
                          {(
                            Array.isArray((product.category_specific as any).screen_size)
                              ? (product.category_specific as any).screen_size
                              : [String((product.category_specific as any).screen_size)]
                          ).slice(0, 4).map((ss: string) => (
                            <Chip key={ss} label={ss} size="small" variant="outlined" />
                          ))}
                          {Array.isArray((product.category_specific as any).screen_size) && (product.category_specific as any).screen_size.length > 4 && (
                            <Chip label={`+${(product.category_specific as any).screen_size.length - 4}`} size="small" />
                          )}
                        </Box>
                      ) : null}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination Controls (offset-based) */}
      {currentProducts.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }} flexWrap="wrap" gap={2}>
          {/* Items per page selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Show:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                displayEmpty
                sx={{ height: 32 }}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              items per page
            </Typography>
          </Box>


              {/* Results info */}
              {total ? (
                <Typography variant="body2" color="text.secondary">
                  Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total} products
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Showing {currentProducts.length} products
                </Typography>
              )}

              {/* Standard pagination only */}
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                  showFirstButton
                  showLastButton
                />
              )}
            </Box>
          )}

      {/* No Results */}
      {currentProducts.length === 0 && !currentLoading && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}
    </Container>
  );
};

// ProductList component with enhanced search and performance monitoring
export default ProductList;
