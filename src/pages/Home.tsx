import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, Button, CircularProgress, Pagination, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import api from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productSlice';
import { AppDispatch, RootState } from '../store';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, total, loading, error } = useSelector((state: RootState) => state.products);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
    priceRange: ''
  });

  useEffect(() => {
    dispatch(fetchProducts({
      offset: (page - 1) * pageSize,
      limit: pageSize
    }));
  }, [dispatch, page, pageSize]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const pageSizeOptions = [4, 8, 12, 16, 20, 24];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Hero Banner */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: 3,
          p: 4,
          mb: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome to E-commerce Microservice
        </Typography>
        <Typography variant="h6" gutterBottom>
          Discover the latest products and best deals!
        </Typography>
        <Button variant="contained" color="secondary" size="large" sx={{ mt: 2 }} href="/products">
          Shop Now
        </Button>
      </Box>

      {/* Categories */}
      {/* Products */}
      <Box mb={5}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Featured Products
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : Array.isArray(products) && products.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => window.location.href = `/products/${product.id}`}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{product.description}</Typography>
                      <Typography variant="h6" color="primary" mt={1}>
                        ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Pagination Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} flexWrap="wrap" gap={2}>
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
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              )}
            </Box>
          </>
        ) : (
          <Typography color="text.secondary">No products found.</Typography>
        )}
      </Box>
    </Container>
  );
};

export default Home; 