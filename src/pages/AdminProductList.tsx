import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Badge,
  LinearProgress,
  InputAdornment,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { 
  fetchAdminProducts, 
  fetchUserProducts, 
  clearSearchResults,
  setFilters,
  clearFilters 
} from '../store/slices/productSlice';
import { SearchFilters } from '../types';
import SearchPerformanceMonitor from '../components/SearchPerformanceMonitor';

const AdminProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get user role from auth state
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  // Product state
  const {
    products,
    loading,
    error,
    total,
    offset,
    limit,
    filters,
    aggregations,
    hasMore,
    cursor,
    nextCursor,
    useElastic,
    es_took,
    es_timed_out,
  } = useSelector((state: RootState) => state.products);

  // Local state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [localFilters, setLocalFilters] = useState<SearchFilters>({
    category: '',
    brand: '',
    inStock: undefined,
    minRating: 0,
    search: '',
    offset: 0,
    limit: 12,
    includeAggregations: true,
  });
  // Hydration guard to avoid double-fetch on initial mount/navigation
  const readyRef = useRef<boolean>(false);
  const [ready, setReady] = useState(false);
  // De-dupe identical fetches (e.g., React 18 StrictMode double effect)
  const lastFetchKeyRef = useRef<string>('');
  // Avoid reacting to our own URL sync
  const lastSyncedParamsKeyRef = useRef<string>('');

  // Determine which fetch function to use based on user role
  const fetchProductsData = async (filters: SearchFilters = {}) => {
    try {
      // Both admin and regular users see only their own products for management
      console.log('👤 Fetching user\'s own products for management');
      await dispatch(fetchUserProducts({
        ...filters,
        includeAggregations: page === 1,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Initial load: hydrate state from URL query params for shareable/persistent views
  useEffect(() => {
    const qp = Object.fromEntries(searchParams.entries());
    const initial: any = { ...localFilters };
    if (qp.search) { initial.search = qp.search; setSearchTerm(qp.search); }
    if (qp.category) { initial.category = qp.category; }
    if (qp.brand) { initial.brand = qp.brand; }
    // Support boolean inStock from query params ("true"/"false" or "1"/"0")
    if (qp.inStock !== undefined) {
      const v = qp.inStock.toLowerCase();
      if (v === 'true' || v === '1') initial.inStock = true;
      else if (v === 'false' || v === '0') initial.inStock = false;
    }
    if (qp.minRating) { initial.minRating = Number(qp.minRating) || 0; }
    if (qp.offset) { initial.offset = Number(qp.offset) || 0; }
    if (qp.limit) { initial.limit = Number(qp.limit) || 12; setPageSize(initial.limit); }
    // Derive page from offset/limit
    const derivedPage = initial.limit ? Math.floor((initial.offset || 0) / initial.limit) + 1 : 1;
    setPage(derivedPage);
    const normalized = { ...initial, includeAggregations: true };
    setLocalFilters(normalized);
    // Mark hydration complete; page effect will run a single fetch with hydrated state
    readyRef.current = true;
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page changes (single source of fetches)
  useEffect(() => {
    if (!readyRef.current && !ready) return; // avoid running before hydration
    const newOffset = (page - 1) * pageSize;
    const updatedFilters = {
      ...localFilters,
      offset: newOffset,
      limit: pageSize,
      includeAggregations: page === 1,
    };

    // De-dupe identical consecutive requests
    const fetchKey = JSON.stringify({ p: page, s: pageSize, f: updatedFilters });
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;

    fetchProductsData(updatedFilters);

    // Sync URL for shareable state
    const nextParams: any = {
      ...Object.fromEntries(searchParams.entries()),
      search: updatedFilters.search || '',
      category: updatedFilters.category || '',
      brand: updatedFilters.brand || '',
      inStock: updatedFilters.inStock !== undefined ? String(updatedFilters.inStock) : '',
      minRating: updatedFilters.minRating ?? '',
      offset: String(updatedFilters.offset || 0),
      limit: String(updatedFilters.limit || 12),
    };
    Object.keys(nextParams).forEach((k) => { if (nextParams[k] === '' || nextParams[k] === undefined) delete nextParams[k]; });
    const paramsKey = JSON.stringify(nextParams);
    lastSyncedParamsKeyRef.current = paramsKey;
    setSearchParams(nextParams, { replace: true });
  }, [page, pageSize, ready]);

  // React to URL query changes (e.g., navigate to ?inStock=false on same route)
  useEffect(() => {
    if (!readyRef.current && !ready) return;
    const qpObj = Object.fromEntries(searchParams.entries());
    const paramsKey = JSON.stringify(qpObj);
    if (lastSyncedParamsKeyRef.current === paramsKey) {
      // Our own update; ignore
      return;
    }
    const next: any = { ...localFilters };
    if ('search' in qpObj) next.search = qpObj.search || '';
    if ('category' in qpObj) next.category = qpObj.category || '';
    if ('brand' in qpObj) next.brand = qpObj.brand || '';
    if ('inStock' in qpObj) {
      const v = String(qpObj.inStock).toLowerCase();
      if (v === 'true' || v === '1') next.inStock = true;
      else if (v === 'false' || v === '0') next.inStock = false;
      else next.inStock = undefined;
    }
    if ('minRating' in qpObj) next.minRating = Number(qpObj.minRating) || 0;
    if ('limit' in qpObj) {
      const l = Number(qpObj.limit) || pageSize;
      if (l !== pageSize) setPageSize(l);
      next.limit = l;
    }
    if ('offset' in qpObj) {
      const off = Number(qpObj.offset) || 0;
      next.offset = off;
      const derivedPage = next.limit ? Math.floor(off / next.limit) + 1 : 1;
      if (derivedPage !== page) setPage(derivedPage);
    }

    // Apply if changed
    const nextKey = JSON.stringify(next);
    const curKey = JSON.stringify(localFilters);
    if (nextKey !== curKey) {
      setLocalFilters(next);
    }
  }, [searchParams, ready]);

  // Handle page size changes
  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const pageSizeOptions = [6, 12, 18, 24, 30, 36];

  // Handle search
  const handleSearch = (term: string) => {
    // Debounced in useEffect; keep this lightweight
    setSearchTerm(term);
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    // Preserve pagination when changing discrete filters; fetch will be triggered by page effect
    const newOffset = (page - 1) * pageSize;
    const updated = {
      ...localFilters,
      [key]: value || undefined,
      offset: newOffset,
      limit: pageSize,
      includeAggregations: page === 1,
    };
    setLocalFilters(updated);
    // Sync URL for shareable state
    const nextParams: any = {
      ...Object.fromEntries(searchParams.entries()),
      search: updated.search || '',
      category: updated.category || '',
      brand: updated.brand || '',
      inStock: updated.inStock !== undefined ? String(updated.inStock) : '',
      minRating: updated.minRating ?? '',
      offset: String(updated.offset || 0),
      limit: String(updated.limit || 12),
    };
    Object.keys(nextParams).forEach((k) => { if (nextParams[k] === '' || nextParams[k] === undefined) delete nextParams[k]; });
    setSearchParams(nextParams, { replace: true });
  };

  // Reset all filters and search; go back to page 1
  const handleResetFilters = () => {
    const cleared = {
      ...localFilters,
      search: undefined,
      category: undefined,
      brand: undefined,
      inStock: undefined,
      minRating: undefined,
      offset: 0,
      limit: pageSize,
      includeAggregations: true,
    };
    setSearchTerm('');
    setPage(1);
    setLocalFilters(cleared);
    const nextParams: any = { limit: String(pageSize) };
    setSearchParams(nextParams, { replace: true });
  };

  // Price filters are intentionally removed for product management page

  // Handle product actions
  const handleEditProduct = (product: any) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleViewProduct = (product: any) => {
    navigate(`/products/${product.id}`);
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        // Implement delete logic here
        console.log('Deleting product:', productToDelete.id);
        // await dispatch(deleteProduct(productToDelete.id));
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        // Refresh the list
        fetchProductsData(localFilters);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleStatusToggle = async (product: any) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      console.log(`Updating product ${product.id} status from ${product.status} to ${newStatus}`);
      
      // Call the backend API to update product status
      const response = await fetch(`/api/products/${product.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        console.log('Product status updated successfully');
        // Refresh the product list to show updated status
        fetchProductsData(localFilters);
      } else {
        console.error('Failed to update product status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleAddProduct = () => {
    navigate('/admin/products/new');
  };

  const handleRefresh = () => {
    fetchProductsData(localFilters);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AdminIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            My Products Management
          </Typography>
          <Chip 
            label={isAdmin ? 'Admin View' : 'User View'} 
            color={isAdmin ? 'primary' : 'secondary'}
            sx={{ ml: 2 }}
          />
        </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your own products. You can view, edit, and delete your products.
      </Typography>
    </Box>

    {/* Search and Filter Bar */}
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, boxShadow: 1 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Search products"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const updatedFilters = { ...localFilters, search: searchTerm, offset: 0, includeAggregations: true };
                setLocalFilters(updatedFilters);
                fetchProductsData(updatedFilters);
              } else if (e.key === 'Escape') {
                handleSearch('');
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="clear search" onClick={() => handleSearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={localFilters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {aggregations?.categories?.buckets?.map((cat: any) => (
                <MenuItem key={cat.key} value={cat.key}>
                  {cat.key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Brand</InputLabel>
            <Select
              value={localFilters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              label="Brand"
            >
              <MenuItem value="">All Brands</MenuItem>
              {aggregations?.brands?.buckets?.map((brand: any) => (
                <MenuItem key={brand.key} value={brand.key}>
                  {brand.key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Min/Max Price inputs removed as per requirements */}
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="text"
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>
    </Box>

    {/* Performance Monitor */}
    <SearchPerformanceMonitor 
      useElastic={useElastic}
      es_took={es_took}
      es_timed_out={es_timed_out}
      total={total}
      resultCount={products.length}
    />

    {/* Loading State */}
    {loading && (
      <>
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
        {/* Skeleton cards for better perceived performance */}
        <Grid container spacing={3}>
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`sk-${idx}`}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton width="60%" />
                  <Skeleton width="90%" />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Box>
                  <Skeleton width="40%" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    )}

    {/* Error State */}
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}

    {/* Product Grid */}
    <Fade in={!loading} timeout={250}>
      <Grid container spacing={3}>
        {products.map((product: any) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" noWrap>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {product.description.substring(0, 100)}...
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label={product.category} 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={product.brand} 
                    size="small" 
                    color="secondary"
                  />
                </Box>
                
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  ${product.price}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stock}
                  </Typography>
                  <Chip 
                    label={product.status} 
                    size="small" 
                    color={product.status === 'active' ? 'success' : 'default'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Rating: {product.rating}/5 ({product.review_count} reviews)
                  </Typography>
                  
                  <Box>
                    <Tooltip title="View Product">
                      <IconButton
                        size="small"
                        onClick={() => handleViewProduct(product)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Product">
                      <IconButton
                        size="small"
                        onClick={() => handleEditProduct(product)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={`${product.status === 'active' ? 'Deactivate' : 'Activate'} Product`}>
                      <IconButton
                        size="small"
                        color={product.status === 'active' ? 'success' : 'default'}
                        onClick={() => handleStatusToggle(product)}
                      >
                        {product.status === 'active' ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      </Fade>
      {/* Empty State */}
      {!loading && products.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't created any products yet.
          </Typography>
        </Box>
      )}

      {/* Pagination Controls */}
      {total > 0 && (
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
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total} products
          </Typography>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminProductList; 