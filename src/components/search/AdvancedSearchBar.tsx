import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { SearchFilters } from '../../types';

interface AdvancedSearchBarProps {
  onSearch?: (results: any) => void;
  showFilters?: boolean;
  placeholder?: string;
  category?: string;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  showFilters = true,
  placeholder = "Search products...",
  category,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { suggestions, suggestionsLoading, searchLoading, aggregations } = useSelector(
    (state: RootState) => state.products
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minRating: 0,
    inStock: undefined, // Changed from false to undefined
    search: '', // Added missing search property
    specifications: {} as Record<string, any>,
    category_specific: {} as Record<string, any>
  });

  // Simple debounced search without lodash
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.length >= 2) {
        // TODO: Implement search suggestions
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  // Handle search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    const searchFilters: SearchFilters = {
      ...filters,
      search: searchTerm,
      offset: 0,
      limit: 20,
    };

    // TODO: Implement search functionality
    if (onSearch) {
      onSearch({ products: [], total: 0 });
    }
    
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchTerm(suggestion.name);
    setShowSuggestions(false);
    // Trigger search immediately when suggestion is clicked
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: category || '',
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      minRating: undefined,
      search: '',
      specifications: {} as Record<string, any>,
      category_specific: {} as Record<string, any>
    });
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-search-container]')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Box sx={{ width: '100%', position: 'relative' }} data-search-container>
      <Paper elevation={3} sx={{ p: 2 }}>
        {/* Main Search Bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: showFilters ? 2 : 0 }}>
          <TextField
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchLoading && <CircularProgress size={20} />}
                  {searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={!searchTerm.trim() || searchLoading}
            sx={{ minWidth: 100 }}
          >
            {searchLoading ? <CircularProgress size={20} /> : 'Search'}
          </Button>
          {showFilters && (
            <IconButton
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              color={showAdvancedFilters ? 'primary' : 'default'}
            >
              {showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                  <MenuItem value="books">Books</MenuItem>
                  <MenuItem value="home">Home & Garden</MenuItem>
                  <MenuItem value="beauty">Beauty & Health</MenuItem>
                  <MenuItem value="toys">Toys & Games</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Brand"
                value={filters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Price Range
                </Typography>
                <Slider
                  value={[filters.minPrice || 0, filters.maxPrice || 1000]}
                  onChange={(_, value) => {
                    const [min, max] = value as number[];
                    handleFilterChange('minPrice', min);
                    handleFilterChange('maxPrice', max);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.inStock || false}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  />
                }
                label="In Stock Only"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button variant="contained" onClick={handleSearch}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Search Suggestions */}
      <Collapse in={showSuggestions && suggestions.length > 0}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <List>
            {suggestionsLoading && (
              <ListItem>
                <CircularProgress size={20} />
                <ListItemText primary="Loading suggestions..." />
              </ListItem>
            )}
            {suggestions.map((suggestion, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => handleSuggestionClick(suggestion)}>
                  <ListItemText
                    primary={suggestion.name}
                    secondary={`${suggestion.brand} • ${suggestion.category}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Collapse>

      {/* Aggregations Display */}
      {aggregations && Object.keys(aggregations).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {aggregations.categories?.buckets?.map((bucket: any) => (
              <Chip
                key={bucket.key}
                label={`${bucket.key} (${bucket.doc_count})`}
                variant="outlined"
                onClick={() => handleFilterChange('category', bucket.key)}
              />
            ))}
            {aggregations.brands?.buckets?.map((bucket: any) => (
              <Chip
                key={bucket.key}
                label={`${bucket.key} (${bucket.doc_count})`}
                variant="outlined"
                onClick={() => handleFilterChange('brand', bucket.key)}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedSearchBar; 