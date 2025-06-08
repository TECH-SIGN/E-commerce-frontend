import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false
  });

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }));
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
                <MenuItem value="clothing">Clothing</MenuItem>
                <MenuItem value="books">Books</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Min Price"
              name="minPrice"
              type="number"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Max Price"
              name="maxPrice"
              type="number"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={product.image_url || 'https://via.placeholder.com/200'}
                alt={product.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  ${product.price}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(product)}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductList; 