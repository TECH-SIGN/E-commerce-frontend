import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
  Chip,
  Rating,
  Divider,
  Tabs,
  Tab,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  TextareaAutosize,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  LocalOffer as LocalOfferIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Reviews as ReviewsIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProductById, advancedSearch } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

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
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  
  const { selectedProduct, loading, error } = useSelector((state: RootState) => state.products);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showSpecsDialog, setShowSpecsDialog] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  // Variant selection state
  const [selectedColor, setSelectedColor] = useState<string | ''>('');
  const [selectedSize, setSelectedSize] = useState<string | ''>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Robust parser for arrays coming as JSON strings or CSV
  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      const s = val.trim();
      // Try JSON array first
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'))) {
        try {
          const parsed = JSON.parse(s.replace(/^"|"$/g, ''));
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          // fallthrough to CSV
        }
      }
      // Fallback: CSV split
      return s.split(',').map(x => x.trim()).filter(Boolean);
    }
    return [];
  };

  const norm = (s: any) => String(s ?? '').trim().toLowerCase();

  // Load product details
  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [id, dispatch]);

  // Load related products
  useEffect(() => {
    if (selectedProduct) {
      const loadRelatedProducts = async () => {
        try {
          const result = await dispatch(advancedSearch({
            category: selectedProduct.category,
            limit: 4,
            offset: 0
          })).unwrap();
          
          // Filter out the current product
          const related = result.products.filter(p => p.id !== selectedProduct.id);
          setRelatedProducts(related);
        } catch (error) {
          console.error('Failed to load related products:', error);
        }
      };
      
      loadRelatedProducts();
    }
  }, [selectedProduct, dispatch]);

  // Check if product/variant is in cart
const buildCartItemId = (baseId?: string, variant?: any) => {
  if (!baseId) return '';
  // return only baseId, don’t append anything
  return baseId;
};
  const isInCart = !!(selectedProduct && cartItems.some(item => item.id === buildCartItemId(selectedProduct.id, selectedVariant)));

  // Derive available variant facets and selected variant (memoized)
  const variantsArr: any[] = React.useMemo(() => {
    const raw = (selectedProduct as any)?.variants;
    if (Array.isArray(raw)) return raw as any[];
    if (typeof raw === 'string') {
      const s = raw.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'))) {
        try {
          return JSON.parse(s.replace(/^"|"$/g, '')) || [];
        } catch {
          return [];
        }
      }
    }
    return [];
  }, [selectedProduct?.id, (selectedProduct as any)?.variants]);

  const variantColors: string[] = React.useMemo(() => {
    const facets = parseArray((selectedProduct as any)?.variant_colors);
    if (facets.length) return facets.map((x) => x.trim()).filter(Boolean);
    // Derive from variants as fallback
    const derived = Array.from(new Set((variantsArr || []).map((v: any) => (v?.color ? String(v.color).trim() : '')).filter(Boolean)));
    return derived as string[];
  }, [selectedProduct?.id, (selectedProduct as any)?.variant_colors, variantsArr]);

  const variantSizes: string[] = React.useMemo(() => {
    const facets = parseArray((selectedProduct as any)?.variant_sizes);
    if (facets.length) return facets.map((x) => x.trim()).filter(Boolean);
    // Derive from variants as fallback
    const derived = Array.from(new Set((variantsArr || []).map((v: any) => (v?.size ? String(v.size).trim() : '')).filter(Boolean)));
    return derived as string[];
  }, [selectedProduct?.id, (selectedProduct as any)?.variant_sizes, variantsArr]);

  useEffect(() => {
    // Reset selection on product change
    setSelectedColor('');
    setSelectedSize('');
    setSelectedVariant(null);
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!variantsArr.length) {
      setSelectedVariant(null);
      return;
    }
    const v = variantsArr.find((v: any) => {
      const colorOk = selectedColor ? norm(v?.color) === norm(selectedColor) : true;
      const sizeOk = selectedSize ? norm(v?.size) === norm(selectedSize) : true;
      return colorOk && sizeOk;
    });
    setSelectedVariant(v || null);
  }, [selectedColor, selectedSize, variantsArr]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load reviews when reviews tab is selected
    if (newValue === 2 && selectedProduct?.id) {
      loadReviews();
    }
  };

  const loadReviews = async () => {
    if (!selectedProduct?.id) return;
    
    try {
      setReviewsLoading(true);
      const response = await api.get(`/api/reviews/${selectedProduct.id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

const handleAddToCart = async () => {
  if (!selectedProduct) return;

  if (!user) {
    toast.error('Please log in first.');
    navigate('/login');
    return;
  }

  try {
    const variantPayload = selectedVariant
      ? {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          color: selectedVariant.color,
          size: selectedVariant.size,
          price: selectedVariant.price ?? selectedProduct.price,
        }
      : (selectedColor || selectedSize)
          ? {
              color: selectedColor || undefined,
              size: selectedSize || undefined,
              price: selectedProduct.price,
            }
          : undefined;

    // Send clean productId to backend
    const response = await api.post('/api/cart', {
      userId: user.id,
      productId: selectedProduct.id,   // ✅ always clean
      quantity,
      variant: variantPayload
    });

    if (![200, 201].includes(response.status)) {
      throw new Error(response.data?.message || 'Failed to add to cart');
    }

    // Update Redux state
    dispatch(addToCart({
      id: selectedProduct.id,                // ✅ clean
      productId: selectedProduct.id,         // ✅ clean
      quantity,
      product: selectedProduct,
      price: variantPayload?.price ?? selectedProduct.price,
      variant: variantPayload,
      // variantKey: buildVariantKey(variantPayload) // optional helper
    }));

    toast.success(`${selectedProduct.name} added to cart!`);
  } catch (error: any) {
    console.error('🛒 Add to cart error:', error);
    toast.error(error.response?.data?.message || error.message || 'Failed to add to cart');
  }
};


  const handleBuyNow = async () => {
    if (!selectedProduct) return;
    // Allow proceeding with constructed variant payload if both options were chosen.
    
    if (!user) {
      toast.error('Please log in first.');
      navigate('/login');
      return;
    }

    // Buy Now should NOT add to cart - go directly to checkout with product data
    try {
      console.log('🚀 Buy Now - Direct checkout for:', selectedProduct.name, 'Quantity:', quantity);
      
      // Navigate directly to checkout with buy-now product data
      // This bypasses the cart completely
      const variantPayload = selectedVariant
        ? {
            id: selectedVariant.id,
            sku: selectedVariant.sku ?? effectiveSku,
            color: selectedVariant.color,
            size: selectedVariant.size,
            price: selectedVariant.price ?? effectivePrice,
          }
        : ((selectedColor || selectedSize)
            ? {
                sku: effectiveSku,
                color: selectedColor || undefined,
                size: selectedSize || undefined,
                price: effectivePrice,
              }
            : undefined);

      navigate('/checkout', {
        state: {
          buyNow: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: variantPayload?.price ?? selectedProduct.price,
            quantity: quantity,
            product: selectedProduct,
            variant: variantPayload
          }
        }
      });
      
      toast.success(`Proceeding to checkout with ${selectedProduct.name}`);
    } catch (error: any) {
      console.error('🚀 Buy now error:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedProduct?.name,
        text: selectedProduct?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      console.log('📝 Submitting review:', reviewForm);
      
      if (!selectedProduct?.id) {
        throw new Error('Product ID not found');
      }
      
      // Call the review API
      const response = await api.post(`/api/reviews/${selectedProduct.id}`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      
      console.log('✅ Review submitted successfully:', response.data);
      
      // Close dialog and reset form
      setShowReviewDialog(false);
      setReviewForm({ rating: 5, comment: '' });
      
      // Refresh product data to show updated rating
      dispatch(fetchProductById(selectedProduct.id));
      
      // Reload reviews to show the new review
      await loadReviews();
      
      // Show success message
      alert('Review submitted successfully!');
    } catch (error: any) {
      console.error('❌ Failed to submit review:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Invalid review data');
      } else if (error.response?.status === 401) {
        alert('Please login to submit a review');
      } else if (error.response?.status === 429) {
        alert('Too many review attempts. Please try again later.');
      } else {
        alert('Failed to submit review. Please try again.');
      }
    }
  };

  const handleEditReview = async () => {
    try {
      if (!editingReview || !selectedProduct?.id) {
        throw new Error('Review or product ID not found');
      }
      
      const response = await api.put(`/api/reviews/${editingReview.id}`, {
        rating: editingReview.rating,
        comment: editingReview.comment
      });
      
      console.log('✅ Review updated successfully:', response.data);
      
      // Close edit dialog and reset
      setEditingReview(null);
      
      // Refresh product data and reviews
      dispatch(fetchProductById(selectedProduct.id));
      await loadReviews();
      
      alert('Review updated successfully!');
    } catch (error: any) {
      console.error('❌ Failed to update review:', error);
      
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Invalid review data');
      } else if (error.response?.status === 401) {
        alert('Please login to edit reviews');
      } else if (error.response?.status === 403) {
        alert('You can only edit your own reviews');
      } else if (error.response?.status === 404) {
        alert('Review not found');
      } else {
        alert('Failed to update review. Please try again.');
      }
    }
  };

  const handleDeleteReview = async () => {
    try {
      if (!reviewToDelete || !selectedProduct?.id) {
        throw new Error('Review or product ID not found');
      }
      
      await api.delete(`/api/reviews/${reviewToDelete.id}`);
      
      console.log('✅ Review deleted successfully');
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setReviewToDelete(null);
      
      // Refresh product data and reviews
      dispatch(fetchProductById(selectedProduct.id));
      await loadReviews();
      
      alert('Review deleted successfully!');
    } catch (error: any) {
      console.error('❌ Failed to delete review:', error);
      
      if (error.response?.status === 401) {
        alert('Please login to delete reviews');
      } else if (error.response?.status === 403) {
        alert('You can only delete your own reviews');
      } else if (error.response?.status === 404) {
        alert('Review not found');
      } else {
        alert('Failed to delete review. Please try again.');
      }
    }
  };

  const openEditDialog = (review: any) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      comment: review.comment
    });
  };

  const openDeleteDialog = (review: any) => {
    setReviewToDelete(review);
    setDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !selectedProduct) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Product not found'}
        </Alert>
      </Container>
    );
  }

  const images = selectedProduct.images || [];
  const specifications = selectedProduct.specifications || {};
  const categorySpecific = selectedProduct.category_specific || {};
  // Facets presence
  const needsColor = variantColors.length > 0;
  const needsSize = variantSizes.length > 0;
  const bothSelectedIfNeeded = (!needsColor || !!selectedColor) && (!needsSize || !!selectedSize);

  // Compute effective values depending on whether concrete variants exist
  const effectivePrice = variantsArr.length > 0
    ? (selectedVariant?.price ?? selectedProduct.price)
    : selectedProduct.price;
  const effectiveStock = variantsArr.length > 0
    ? (bothSelectedIfNeeded
        ? (typeof selectedVariant?.stock === 'number' ? selectedVariant.stock : selectedProduct.stock)
        : 0)
    : selectedProduct.stock;
  const effectiveSku = variantsArr.length > 0
    ? (bothSelectedIfNeeded ? (selectedVariant?.sku ?? selectedProduct.sku) : '')
    : selectedProduct.sku;

  // Require selection if either facet exists; enable once both chosen regardless of variant match
  const requiresVariant = needsColor || needsSize || variantsArr.length > 0;
  const selectionIncomplete = (needsColor && !selectedColor) || (needsSize && !selectedSize);
  const addDisabled = selectionIncomplete || (Number(effectiveStock) <= 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Home / {selectedProduct.category} / {selectedProduct.name}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="400"
                image={images[selectedImage] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                alt={selectedProduct.name}
                sx={{ objectFit: 'cover', borderRadius: 2 }}
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {images.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 80,
                        height: 80,
                        border: index === selectedImage ? '2px solid #1976d2' : '1px solid #ddd',
                        borderRadius: 1,
                        cursor: 'pointer',
                        overflow: 'hidden'
                      }}
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={image}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {/* Product Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {selectedProduct.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip label={selectedProduct.brand} color="primary" />
                <Chip label={selectedProduct.category} variant="outlined" />
                <Chip 
                  label={effectiveStock > 0 ? 'In Stock' : 'Out of Stock'} 
                  color={effectiveStock > 0 ? 'success' : 'error'} 
                />
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={Number(selectedProduct?.rating) || 0} readOnly precision={0.5} />
                <Typography variant="body2">
                  {selectedProduct.rating} ({selectedProduct.review_count} reviews)
                </Typography>
              </Box>

              {/* Price */}
              <Typography variant="h3" color="primary" gutterBottom>
                ₹{Number(effectivePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>

              {/* SKU */}
              <Typography variant="body2" color="text.secondary">
                SKU: {effectiveSku}
              </Typography>
            </Box>

            {/* Variant Selectors */}
            {requiresVariant && (
              <Box sx={{ mb: 3 }}>
                {variantColors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Color</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel id="color-select-label">Select Color</InputLabel>
                      <Select
                        labelId="color-select-label"
                        value={selectedColor}
                        label="Select Color"
                        onChange={(e) => setSelectedColor(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {variantColors.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
                {variantSizes.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Size</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel id="size-select-label">Select Size</InputLabel>
                      <Select
                        labelId="size-select-label"
                        value={selectedSize}
                        label="Select Size"
                        onChange={(e) => setSelectedSize(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {variantSizes.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
                {selectedVariant && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    {selectedVariant.sku && <Chip size="small" label={`SKU: ${selectedVariant.sku}`} />}
                    {typeof selectedVariant.stock === 'number' && <Chip size="small" label={`Stock: ${selectedVariant.stock}`} />}
                    {typeof selectedVariant.price === 'number' && <Chip size="small" color="info" label={`Price: ₹${Number(selectedVariant.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />}
                  </Box>
                )}
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<CartIcon />}
                    disabled={addDisabled || isInCart}
                    onClick={handleAddToCart}
                  >
                    {isInCart ? 'In Cart' : 'Add to Cart'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    color="secondary"
                    onClick={handleBuyNow}
                    disabled={addDisabled}
                  >
                    Buy Now
                  </Button>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  color={favorite ? 'error' : 'default'}
                  onClick={() => setFavorite(!favorite)}
                  sx={{ border: '1px solid #ddd', borderRadius: 2 }}
                >
                  <FavoriteIcon />
                </IconButton>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                >
                  Share
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CompareIcon />}
                >
                  Compare
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  onClick={() => setShowSpecsDialog(true)}
                >
                  Specifications
                </Button>
              </Box>
            </Box>

            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Quantity</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1, max: effectiveStock }}
                  sx={{ width: 100 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {effectiveStock} available
                </Typography>
              </Box>
            </Box>

            {/* Quick Specs */}
            {Object.keys(specifications).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Specifications
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(specifications).slice(0, 4).map(([key, value]) => (
                    <Grid item xs={6} key={key}>
                      <Typography variant="body2" color="text.secondary">
                        {key.replace(/_/g, ' ').toUpperCase()}: {value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Product Details Tabs */}
      <Paper elevation={2} sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="product details tabs">
            <Tab label="Description" />
            <Tab label="Specifications" />
            <Tab label="Reviews" />
            <Tab label="Related Products" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" paragraph>
            {selectedProduct.description}
          </Typography>
          
          {selectedProduct.tags && selectedProduct.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedProduct.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Specifications */}
            {Object.keys(specifications).length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Technical Specifications
                </Typography>
                <List>
                  {Object.entries(specifications).map(([key, value]) => (
                    <ListItem key={key} divider>
                      <ListItemText
                        primary={key.replace(/_/g, ' ').toUpperCase()}
                        secondary={value}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* Category Specific */}
            {Object.keys(categorySpecific).length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Category Specific
                </Typography>
                <List>
                  {Object.entries(categorySpecific).map(([key, value]) => (
                    <ListItem key={key} divider>
                      <ListItemText
                        primary={key.replace(/_/g, ' ').toUpperCase()}
                        secondary={value}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* Physical Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Physical Details
              </Typography>
              <Grid container spacing={2}>
                {selectedProduct.weight && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Weight</Typography>
                    <Typography variant="body1">{selectedProduct.weight} kg</Typography>
                  </Grid>
                )}
                {selectedProduct.dimensions && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Length</Typography>
                      <Typography variant="body1">{selectedProduct.dimensions.length} cm</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Width</Typography>
                      <Typography variant="body1">{selectedProduct.dimensions.width} cm</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Height</Typography>
                      <Typography variant="body1">{selectedProduct.dimensions.height} cm</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Reviews
              </Typography>
              {reviews.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating value={Number(selectedProduct?.rating) || 0} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {(Number(selectedProduct?.rating) || 0).toFixed(1)} out of 5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowReviewDialog(true)}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Write a Review
            </Button>
          </Box>
          
          {reviewsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reviews.length > 0 ? (
            <Box>
              {reviews.map((review: any) => (
                <Paper key={review.id} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {(review.user_name || 'A').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {review.user_name || 'Anonymous'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Rating value={Number(review.rating) || 0} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Action buttons - only show for user's own reviews */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Edit Review">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(review)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Review">
                        <IconButton 
                          size="small" 
                          onClick={() => openDeleteDialog(review)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" sx={{ 
                    lineHeight: 1.6,
                    color: 'text.primary',
                    backgroundColor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main'
                  }}>
                    {review.comment}
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ReviewsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reviews yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                Be the first to share your experience with this product. Your review helps other customers make informed decisions.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setShowReviewDialog(true)}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Write the First Review
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Related Products
          </Typography>
          {relatedProducts.length > 0 ? (
            <Grid container spacing={3}>
              {relatedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate(`/products/${product.id}`)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                      alt={product.name}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {product.brand}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Rating value={product.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({product.review_count})
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No related products found
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {/* Specifications Dialog */}
      <Dialog
        open={showSpecsDialog}
        onClose={() => setShowSpecsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Product Specifications</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {Object.keys(specifications).length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Technical Specifications
                </Typography>
                <List>
                  {Object.entries(specifications).map(([key, value]) => (
                    <ListItem key={key} divider>
                      <ListItemText
                        primary={key.replace(/_/g, ' ').toUpperCase()}
                        secondary={value}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {Object.keys(categorySpecific).length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Category Specific
                </Typography>
                <List>
                  {Object.entries(categorySpecific).map(([key, value]) => (
                    <ListItem key={key} divider>
                      <ListItemText
                        primary={key.replace(/_/g, ' ').toUpperCase()}
                        secondary={value}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSpecsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReviewsIcon color="primary" />
            <Typography variant="h6">Write a Review</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              {selectedProduct?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your experience with this product
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rating *
            </Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(event, newValue) => {
                setReviewForm(prev => ({ ...prev, rating: newValue || 5 }));
              }}
              size="large"
              sx={{ '& .MuiRating-iconFilled': { color: 'warning.main' } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {reviewForm.rating === 1 ? 'Poor' : 
               reviewForm.rating === 2 ? 'Fair' : 
               reviewForm.rating === 3 ? 'Good' : 
               reviewForm.rating === 4 ? 'Very Good' : 'Excellent'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Your Review *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Tell us about your experience with this product. What did you like or dislike? Would you recommend it to others?"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {reviewForm.comment.length}/500 characters
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 3,
          gap: 2
        }}>
          <Button 
            onClick={() => setShowReviewDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleReviewSubmit}
            disabled={!reviewForm.comment.trim() || reviewForm.comment.length > 500}
            sx={{ borderRadius: 2, px: 4 }}
            startIcon={<ReviewsIcon />}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog
        open={!!editingReview}
        onClose={() => setEditingReview(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">Edit Review</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              {selectedProduct?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your review
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rating *
            </Typography>
            <Rating
              value={editingReview?.rating}
              onChange={(event, newValue) => {
                setEditingReview(prev => ({ ...prev, rating: newValue || 5 }));
              }}
              size="large"
              sx={{ '& .MuiRating-iconFilled': { color: 'warning.main' } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {editingReview?.rating === 1 ? 'Poor' : 
               editingReview?.rating === 2 ? 'Fair' : 
               editingReview?.rating === 3 ? 'Good' : 
               editingReview?.rating === 4 ? 'Very Good' : 'Excellent'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Your Review *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Tell us about your experience with this product. What did you like or dislike? Would you recommend it to others?"
              value={editingReview?.comment}
              onChange={(e) => setEditingReview(prev => ({ ...prev, comment: e.target.value }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {editingReview?.comment?.length || 0}/500 characters
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 3,
          gap: 2
        }}>
          <Button 
            onClick={() => setEditingReview(null)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditReview}
            disabled={!editingReview?.comment?.trim() || (editingReview?.comment?.length || 0) > 500}
            sx={{ borderRadius: 2, px: 4 }}
            startIcon={<EditIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Confirm Deletion</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <DeleteIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Delete Review?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Are you sure you want to delete this review? This action cannot be undone.
            </Typography>
            {reviewToDelete && (
              <Paper sx={{ mt: 3, p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  "{reviewToDelete.comment.substring(0, 100)}{reviewToDelete.comment.length > 100 ? '...' : ''}"
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 3,
          gap: 2
        }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteReview}
            sx={{ borderRadius: 2, px: 4 }}
            startIcon={<DeleteIcon />}
          >
            Delete Review
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductDetail;
