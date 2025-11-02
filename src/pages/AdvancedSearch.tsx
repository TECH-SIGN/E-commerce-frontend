import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Drawer,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  LocalOffer as LocalOfferIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { SearchFilters } from '../types';
import { 
  advancedSearch, 
  getSearchSuggestions,
  getAllCategorySpecs,
  clearSearchResults 
} from '../store/slices/productSlice';
import { debounce } from '../utils/debounce';
import searchService from '../services/searchService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedSearch: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    searchResults, 
    total, 
    searchLoading, 
    searchError, 
    suggestions, 
    suggestionsLoading,
    categorySpecs,
    aggregations,
    fallbackUsed
  } = useSelector((state: RootState) => state.products);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: 0,
    inStock: undefined, // Changed from false to undefined
    specifications: {} as Record<string, any>,
    category_specific: {} as Record<string, any>
  });

  // Debounced search function for suggestions
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.length >= 2) {
        dispatch(getSearchSuggestions({ query, category: selectedCategory }));
      }
    }, 300),
    [dispatch, selectedCategory]
  );

  // Debounced search function for main search
  const debouncedMainSearch = useMemo(
    () => debounce(async (searchFilters: any) => {
      try {
        console.log('🔍 Performing debounced search with filters:', searchFilters);
        await dispatch(advancedSearch(searchFilters));
      } catch (err) {
        console.error('❌ Failed to perform search:', err);
      }
    }, 500),
    [dispatch]
  );

  // Load category specifications on mount
  useEffect(() => {
    dispatch(getAllCategorySpecs());
  }, [dispatch]);

  // Handle search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Perform search when filters change with debouncing
  useEffect(() => {
    const searchFilters = {
      offset: (page - 1) * pageSize,
      limit: pageSize,
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      ...filters,
      // Convert string values to numbers for price filters
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      // Ensure brand is properly formatted
      brand: filters.brand ? filters.brand.trim() : undefined,
      includeAggregations: true
    };

    // Use debounced search for better performance
    debouncedMainSearch(searchFilters);
    
    return () => debouncedMainSearch.cancel();
  }, [debouncedMainSearch, page, pageSize, searchTerm, selectedCategory, filters]);

  // Get current category specifications
  const currentCategorySpecs = useMemo(() => {
    if (!Array.isArray(categorySpecs) || categorySpecs.length === 0) {
      return null;
    }
    return categorySpecs.find(spec => spec.category === selectedCategory);
  }, [categorySpecs, selectedCategory]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Handle specification filter changes
  const handleSpecificationChange = (specKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specKey]: value
      }
    }));
    setPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRating: 0,
      inStock: undefined, // Changed from false to undefined
      specifications: {},
      category_specific: {}
    });
    setPage(1);
    dispatch(clearSearchResults());
    
    // Trigger search to show all products immediately
    const searchFilters = {
      offset: 0,
      limit: pageSize,
      category: '',
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: 0,
      inStock: undefined,
      specifications: {},
      category_specific: {},
      includeAggregations: true
    };
    
    // Use debounced search to show all products
    debouncedMainSearch(searchFilters);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    setSearchTerm(suggestion.name);
    setPage(1);
  };

  // Manual search function (for search button)
  const handleManualSearch = () => {
    if (searchTerm && searchTerm.trim().length > 0) {
      // Perform immediate search without debouncing
      const searchFilters = {
        offset: 0, // Reset to first page
        limit: pageSize,
        search: searchTerm.trim(),
        category: selectedCategory || undefined,
        ...filters,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        brand: filters.brand ? filters.brand.trim() : undefined,
        includeAggregations: true
      };
      dispatch(advancedSearch(searchFilters));
      setPage(1); // Reset to first page
    } else {
      // If search term is empty, show all products
      const searchFilters = {
        offset: 0,
        limit: pageSize,
        category: selectedCategory || undefined,
        ...filters,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        brand: filters.brand ? filters.brand.trim() : undefined,
        includeAggregations: true
      };
      dispatch(advancedSearch(searchFilters)); // Use advancedSearch with empty search
      setPage(1);
    }
  };

  // Handle Enter key press in search field
  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleManualSearch();
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Advanced Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find exactly what you're looking for with our powerful search tools
        </Typography>
        {fallbackUsed && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Using database search (Elasticsearch temporarily unavailable)
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Search Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Search Filters
            </Typography>

            {/* Search Input */}
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                freeSolo
                options={suggestions}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : option.name
                }
                inputValue={searchTerm}
                onInputChange={(_, newValue) => setSearchTerm(newValue)}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue === 'object') {
                    handleSuggestionSelect(newValue);
                  }
                }}
                loading={suggestionsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    placeholder="Search products..."
                    onKeyPress={handleSearchKeyPress}
                    InputProps={{
                      ...params.InputProps,
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
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.brand} • {option.category}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Box>

            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Array.isArray(categorySpecs) && categorySpecs.map((spec) => (
                    <MenuItem key={spec.category} value={spec.category}>
                      {spec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Price Range */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Price Range</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={[Number(filters.minPrice) || 0, Number(filters.maxPrice) || 10000]}
                    onChange={(_, value) => {
                      const [min, max] = value as number[];
                      handleFilterChange('minPrice', min.toString());
                      handleFilterChange('maxPrice', max.toString());
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10000}
                    step={100}
                  />
                  <Box display="flex" gap={1} sx={{ mt: 2 }}>
                    <TextField
                      size="small"
                      label="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      type="number"
                    />
                    <TextField
                      size="small"
                      label="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      type="number"
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Rating Filter */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Rating</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" alignItems="center" gap={1}>
                  <Rating
                    value={filters.minRating}
                    onChange={(_, value) => handleFilterChange('minRating', value || 0)}
                    precision={0.5}
                  />
                  <Typography variant="body2">({filters.minRating}+)</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Stock Filter */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Availability</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.inStock === true} // Adjusted to check for true
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    />
                  }
                  label="In Stock Only"
                />
              </AccordionDetails>
            </Accordion>

            {/* Brand Filter */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Brand</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Autocomplete
                  freeSolo
                  options={aggregations?.brands?.buckets?.map((bucket: any) => bucket.key) || []}
                  value={filters.brand}
                  onChange={(_, newValue) => handleFilterChange('brand', newValue || '')}
                  onInputChange={(_, newValue) => handleFilterChange('brand', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      label="Brand"
                      placeholder="Select or type brand name"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Typography variant="body2">{option}</Typography>
                    </Box>
                  )}
                />
              </AccordionDetails>
            </Accordion>

            {/* Category-Specific Filters */}
            {currentCategorySpecs && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{currentCategorySpecs.name} Specs</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(currentCategorySpecs.filters).map(([key, options]) => (
                      <Grid item xs={12} key={key}>
                        <FormControl fullWidth size="small">
                          <InputLabel>{key.replace(/_/g, ' ').toUpperCase()}</InputLabel>
                          <Select
                            value={filters.specifications[key] || ''}
                            label={key.replace(/_/g, ' ').toUpperCase()}
                            onChange={(e) => handleSpecificationChange(key, e.target.value)}
                          >
                            <MenuItem value="">Any {key.replace(/_/g, ' ')}</MenuItem>
                            {Array.isArray(options) && options.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Clear Filters */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              sx={{ mt: 2 }}
            >
              Clear All Filters
            </Button>
          </Paper>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12} md={9}>
          {/* Search Results Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Search Results ({total} products found)
                {searchLoading && (
                  <CircularProgress size={20} sx={{ ml: 2 }} />
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="price_asc">Price: Low to High</MenuItem>
                    <MenuItem value="price_desc">Price: High to Low</MenuItem>
                    <MenuItem value="rating">Rating</MenuItem>
                    <MenuItem value="newest">Newest</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                </IconButton>
              </Box>
            </Box>

            {/* Active Filters */}
            {(searchTerm || selectedCategory || Object.values(filters).some(v => v && v !== '')) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm('')} />
                )}
                {selectedCategory && (
                  <Chip label={`Category: ${selectedCategory}`} onDelete={() => setSelectedCategory('')} />
                )}
                {filters.brand && (
                  <Chip label={`Brand: ${filters.brand}`} onDelete={() => handleFilterChange('brand', '')} />
                )}
                {filters.minPrice && (
                  <Chip label={`Min Price: ₹${filters.minPrice}`} onDelete={() => handleFilterChange('minPrice', '')} />
                )}
                {filters.maxPrice && (
                  <Chip label={`Max Price: ₹${filters.maxPrice}`} onDelete={() => handleFilterChange('maxPrice', '')} />
                )}
                {filters.minRating > 0 && (
                  <Chip label={`Rating: ${filters.minRating}+`} onDelete={() => handleFilterChange('minRating', 0)} />
                )}
                {filters.inStock === true && ( // Adjusted to check for true
                  <Chip label="In Stock Only" onDelete={() => handleFilterChange('inStock', undefined)} />
                )}
              </Box>
            )}
          </Paper>

          {/* Error Display */}
          {searchError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {searchError}
            </Alert>
          )}

          {/* Loading State */}
          {searchLoading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Search Results */}
          {!searchLoading && searchResults.length > 0 && (
            <>
              <Grid container spacing={3}>
                {searchResults.map((product) => (
                  <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} lg={viewMode === 'grid' ? 3 : 12} key={product.id}>
                    <Card sx={{ height: viewMode === 'grid' ? '100%' : 'auto', display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row' }}>
                      <CardMedia
                        component="img"
                        height={viewMode === 'grid' ? 200 : 150}
                        width={viewMode === 'grid' ? '100%' : 200}
                        image={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                        alt={product.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom noWrap>
                          {product.name}
                        </Typography>
                        
                        {viewMode === 'list' && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {product.description}
                          </Typography>
                        )}
                        
                        {/* Brand and Category */}
                        <Box sx={{ mb: 2 }}>
                          <Chip label={product.brand} size="small" sx={{ mr: 1 }} />
                          <Chip label={product.category} size="small" variant="outlined" />
                        </Box>

                        {/* Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Rating value={product.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({product.review_count})
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" color="primary">
                            ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                          <Chip 
                            label={product.stock > 0 ? 'In Stock' : 'Out of Stock'} 
                            color={product.stock > 0 ? 'success' : 'error'} 
                            size="small" 
                          />
                        </Box>

                        {/* Specifications Preview */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Specs: {Object.entries(product.specifications).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </Typography>
                          </Box>
                        )}

                        <Button 
                          variant="contained" 
                          fullWidth 
                          disabled={product.stock === 0}
                          onClick={() => window.location.href = `/products/${product.id}`}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}

          {/* No Results */}
          {!searchLoading && searchResults.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or browse different categories.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Aggregations Sidebar */}
      {aggregations && Object.keys(aggregations).length > 0 && (
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 300,
              boxSizing: 'border-box',
              mt: 8
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Insights
            </Typography>
            
            {aggregations.categories && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Categories
                </Typography>
                <List dense>
                  {aggregations.categories.buckets?.slice(0, 5).map((bucket: any) => (
                    <ListItem key={bucket.key}>
                      <ListItemText 
                        primary={bucket.key} 
                        secondary={`${bucket.doc_count} products`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {aggregations.brands && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Popular Brands
                </Typography>
                <List dense>
                  {aggregations.brands.buckets?.slice(0, 5).map((bucket: any) => (
                    <ListItem 
                      key={bucket.key}
                      button
                      onClick={() => handleFilterChange('brand', bucket.key)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemText 
                        primary={bucket.key} 
                        secondary={`${bucket.doc_count} products`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {aggregations.price_ranges && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Price Ranges
                </Typography>
                <List dense>
                  {aggregations.price_ranges.buckets?.map((bucket: any) => (
                    <ListItem key={bucket.key}>
                      <ListItemText 
                        primary={`₹${bucket.from || 0} - ₹${bucket.to || '∞'}`} 
                        secondary={`${bucket.doc_count} products`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Drawer>
      )}
    </Container>
  );
};

export default AdvancedSearch; 