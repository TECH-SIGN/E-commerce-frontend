import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import productService from '../services/productService';
import { getAllCategorySpecs, getCategorySpecs } from '../store/slices/productSlice';

const EditProduct: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categorySpecs, currentCategorySpecs } = useSelector((state: RootState) => state.products);

  console.log('🔍 EditProduct component rendered');
  console.log('🔍 productId:', productId);
  console.log('🔍 user:', user);
  console.log('🔍 categorySpecs:', categorySpecs);
  console.log('🔍 currentCategorySpecs:', currentCategorySpecs);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<any>(null);

  // Form data
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    sku: '',
    weight: '',
    meta_title: '',
    meta_description: ''
  });

  const [specifications, setSpecifications] = useState<Record<string, any>>({});
  const [categorySpecific, setCategorySpecific] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({
    width: '',
    height: '',
    length: ''
  });
  const [images, setImages] = useState<string[]>([]);

  // Load category specifications on mount
  useEffect(() => {
    console.log('🔄 Loading category specifications...');
    dispatch(getAllCategorySpecs());
  }, [dispatch]);

  // Load category-specific specs when category changes
  useEffect(() => {
    if (productData.category) {
      console.log('🔄 Loading specs for category:', productData.category);
      dispatch(getCategorySpecs(productData.category));
    }
  }, [productData.category, dispatch]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        console.log('❌ No productId provided');
        return;
      }
      
      console.log('🔄 Loading product with ID:', productId);
      
      try {
        setLoading(true);
        const productData = await productService.getProductById(productId);
        console.log('✅ Product loaded successfully:', productData);
        setProduct(productData);
        
        // Populate form data
        setProductData({
          name: productData.name || '',
          description: productData.description || '',
          price: productData.price?.toString() || '',
          category: productData.category || '',
          brand: productData.brand || '',
          stock: productData.stock?.toString() || '',
          sku: productData.sku || '',
          weight: productData.weight?.toString() || '',
          meta_title: productData.meta_title || '',
          meta_description: productData.meta_description || ''
        });

        // Parse specifications
        if (productData.specifications) {
          const specs = typeof productData.specifications === 'string' 
            ? JSON.parse(productData.specifications) 
            : productData.specifications;
          setSpecifications(specs);
        }

        // Parse category specific
        if (productData.category_specific) {
          const catSpecs = typeof productData.category_specific === 'string'
            ? JSON.parse(productData.category_specific)
            : productData.category_specific;
          setCategorySpecific(catSpecs);
        }

        // Parse dimensions
        if (productData.dimensions) {
          const dims = typeof productData.dimensions === 'string'
            ? JSON.parse(productData.dimensions)
            : productData.dimensions;
          setDimensions(dims);
        }

        // Parse tags
        if (productData.tags) {
          const tagArray = typeof productData.tags === 'string'
            ? JSON.parse(productData.tags)
            : productData.tags;
          setTags(tagArray || []);
        }

        // Set images
        if (productData.images) {
          const imageArray = typeof productData.images === 'string'
            ? JSON.parse(productData.images)
            : productData.images;
          setImages(imageArray || []);
        }

      } catch (err: any) {
        console.error('❌ Error loading product:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          productId
        });
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleBasicChange = (field: string, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecificationChange = (field: string, value: any) => {
    setSpecifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategorySpecificChange = (field: string, value: any) => {
    setCategorySpecific(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionChange = (field: string, value: string) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagChange = (value: string) => {
    const tagArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setTags(tagArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Validate required fields
      if (!productData.category) {
        throw new Error('Category is required');
      }

      // Validate required specifications if category specs are loaded
      if (currentCategorySpecs && currentCategorySpecs.required && Array.isArray(currentCategorySpecs.required)) {
        const missingSpecs = currentCategorySpecs.required.filter(field => !specifications[field]);
        if (missingSpecs.length > 0) {
          throw new Error(`Missing required specifications: ${missingSpecs.join(', ')}`);
        }
      }

      // Create FormData
      const formData = new FormData();
      
      // Basic product data
      Object.entries(productData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Add specifications as JSON
      formData.append('specifications', JSON.stringify(specifications));
      formData.append('category_specific', JSON.stringify(categorySpecific));
      
      // Add dimensions as JSON
      if (dimensions.width || dimensions.height || dimensions.length) {
        formData.append('dimensions', JSON.stringify(dimensions));
      }

      // Add tags as JSON
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }

      // Update product
      await productService.updateProduct(productId, formData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  if (loading) {
    console.log('🔄 EditProduct: Loading state');
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!product) {
    console.log('❌ EditProduct: No product found');
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          Product not found
        </Alert>
      </Container>
    );
  }

  console.log('✅ EditProduct: Rendering form with product:', product);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Product
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Product updated successfully! Redirecting...
        </Alert>
      )}

      {/* Product Preview */}
      {product && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Product
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                {images.length > 0 && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={images[0]}
                    alt={product.name}
                    sx={{ objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${product.price}
                </Typography>
                <Chip label={product.category} size="small" sx={{ mr: 1 }} />
                <Chip label={product.brand} size="small" sx={{ mr: 1 }} />
                <Chip label={`Stock: ${product.stock}`} size="small" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Product Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Product Name"
              value={productData.name}
              onChange={(e) => handleBasicChange('name', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SKU"
              value={productData.sku}
              onChange={(e) => handleBasicChange('sku', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={productData.description}
              onChange={(e) => handleBasicChange('description', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Price"
              value={productData.price}
              onChange={(e) => handleBasicChange('price', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Stock"
              value={productData.stock}
              onChange={(e) => handleBasicChange('stock', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Weight (kg)"
              value={productData.weight}
              onChange={(e) => handleBasicChange('weight', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Brand"
              value={productData.brand}
              onChange={(e) => handleBasicChange('brand', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={productData.category}
                onChange={(e) => handleBasicChange('category', e.target.value)}
                label="Category"
              >
                {Array.isArray(categorySpecs) && categorySpecs.map((spec) => (
                  <MenuItem key={spec.category} value={spec.category}>
                    {spec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Dimensions */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Dimensions
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Width (cm)"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Height (cm)"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Length (cm)"
              value={dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={tags.join(', ')}
              onChange={(e) => handleTagChange(e.target.value)}
              helperText="Enter tags separated by commas"
            />
          </Grid>

          {/* Meta Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Meta Title"
              value={productData.meta_title}
              onChange={(e) => handleBasicChange('meta_title', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Meta Description"
              value={productData.meta_description}
              onChange={(e) => handleBasicChange('meta_description', e.target.value)}
            />
          </Grid>

          {/* Specifications */}
          {currentCategorySpecs && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
              </Grid>

              {currentCategorySpecs.required && Array.isArray(currentCategorySpecs.required) && 
                currentCategorySpecs.required.map(field => (
                  <Grid item xs={12} md={6} key={field}>
                    <TextField
                      fullWidth
                      label={`${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                      value={specifications[field] || ''}
                      onChange={(e) => handleSpecificationChange(field, e.target.value)}
                      required
                      helperText={`Required for ${currentCategorySpecs.name}`}
                    />
                  </Grid>
                ))}

              {currentCategorySpecs.optional && Array.isArray(currentCategorySpecs.optional) && 
                currentCategorySpecs.optional.map(field => (
                  <Grid item xs={12} md={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={specifications[field] || ''}
                      onChange={(e) => handleSpecificationChange(field, e.target.value)}
                    />
                  </Grid>
                ))}
            </>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default EditProduct; 