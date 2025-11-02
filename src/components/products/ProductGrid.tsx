import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  Rating,
  Skeleton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Inventory as InventoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from '../../store';
import { Product } from '../../types';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../services/api';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  isAdmin?: boolean;
  onProductAction?: (action: string, product: Product) => void;
  showStock?: boolean;
  showStatus?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  isAdmin = false,
  onProductAction,
  showStock = true,
  showStatus = true,
}) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingCartItems, setLoadingCartItems] = useState<Set<string>>(new Set());
  const dispatch = useDispatch<AppDispatch>();

  const handleAddToCart = useCallback(async (product: Product) => {
    console.log('🛒 handleAddToCart called with product:', product);
    console.log('🛒 Current user state:', user);
    console.log('🛒 Token exists:', !!localStorage.getItem('token'));

    if (!user) {
      console.log('🛒 No user found, redirecting to login');
      toast.error('Please log in first.');
      navigate('/login');
      return;
    }

    console.log('🛒 User found, proceeding with add to cart');

    // Set loading state for this product
    setLoadingCartItems(prev => new Set(prev).add(product.id));

    try {
      // Call backend API to add to cart
      console.log('🛒 Adding to cart:', {
        userId: user.id,
        productId: product.id,
        quantity: 1,
        token: localStorage.getItem('token') ? 'Present' : 'Missing'
      });

      console.log('🛒 Making API call to /api/cart...');
      const response = await api.post('/api/cart', {
        userId: user.id,
        productId: product.id,
        quantity: 1
      });

      console.log('🛒 Cart API response received:', response);
      console.log('�� Response status:', response.status);
      console.log('🛒 Response data:', response.data);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to add to cart');
      }

      console.log('🛒 Success! Updating Redux state...');
      // Update Redux state
      dispatch(addToCart({
        id: product.id,
        productId: product.id,
        quantity: 1,
        product: product,
        price: product.price
      }));

      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('🛒 Add to cart error:', error);
      console.error('🛒 Error response:', error.response?.data);
      console.error('🛒 Error status:', error.response?.status);
      console.error('🛒 Error message:', error.message);
      toast.error(error.response?.data?.message || error.message || 'Failed to add to cart');
    } finally {
      // Clear loading state for this product
      setLoadingCartItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }, [user, navigate, dispatch]);

  const handleToggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        toast.info('Removed from favorites');
      } else {
        newFavorites.add(productId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProduct(product);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedProduct(null);
  }, []);

  const handleAdminAction = useCallback((action: string) => {
    if (selectedProduct && onProductAction) {
      onProductAction(action, selectedProduct);
    }
    handleMenuClose();
  }, [selectedProduct, onProductAction, handleMenuClose]);

  const getStockColor = useCallback((stock: number) => {
    if (stock === 0) return 'error';
    if (stock < 10) return 'warning';
    return 'success';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return status === 'active' ? 'success' : 'error';
  }, []);

  // Memoize loading skeleton
  const loadingSkeleton = useMemo(() => (
    <Grid container spacing={3}>
      {Array.from({ length: 12 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  ), []);

  if (loading) {
    return loadingSkeleton;
  }

  return (
    <>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              {/* Product Image */}
              <CardMedia
                component="img"
                height="200"
                image={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo='}
                alt={product.name}
                sx={{ 
                  cursor: 'pointer',
                  objectFit: 'cover',
                }}
                onClick={(e) => {
                  console.log('🖱️ Product image clicked:', product.id, product.name);
                  handleProductClick(product);
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NyA4OC4wMDAxIDgxLjUgOTguMDAwMSA4MS41SDEwMkMxMTIgODAuNSAxMjAgODguNTQ0NyAxMjAgOThWMTAyQzEyMCAxMTIuNDU1IDEwMiAxMjAuNSAxMDIgMTIwLjVIMTAwQzkwIDEyMC41IDgyIDExMi40NTUgODIgMTAyVjEwMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxNkgxNFYxOFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                }}
              />

              {/* Status Badge */}
              {showStatus && (
                <Chip
                  label={product.status}
                  color={getStatusColor(product.status)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 1,
                  }}
                />
              )}

              {/* Stock Badge */}
              {showStock && (
                <Chip
                  icon={<InventoryIcon />}
                  label={`${product.stock} in stock`}
                  color={getStockColor(product.stock)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Product Name */}
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  {product.name}
                </Typography>

                {/* Brand and Category */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {product.brand} • {product.category}
                </Typography>

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={product.rating} precision={0.5} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({product.review_count})
                  </Typography>
                </Box>

                {/* Price */}
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ${product.price.toFixed(2)}
                </Typography>

                {/* SKU */}
                <Typography variant="caption" color="text.secondary">
                  SKU: {product.sku}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Add to Cart */}
                  <Tooltip title={
                    product.status === 'inactive' ? 'Product Unavailable' :
                    product.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                  }>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        console.log('🛒 Cart button clicked for product:', product.id);
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.status === 'inactive' || product.stock === 0 || loadingCartItems.has(product.id)}
                      color={product.status === 'inactive' ? 'error' : 'default'}
                    >
                      {loadingCartItems.has(product.id) ? (
                        <CircularProgress size={20} />
                      ) : (
                        <CartIcon />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Favorite */}
                  <Tooltip title={favorites.has(product.id) ? 'Remove from Favorites' : 'Add to Favorites'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleFavorite(product.id)}
                      color={favorites.has(product.id) ? 'error' : 'default'}
                    >
                      {favorites.has(product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Tooltip>

                  {/* View Details */}
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleProductClick(product)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Admin Actions */}
                {isAdmin && (
                  <Box>
                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, product)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Admin Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleAdminAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Product</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAdminAction('toggle-status')}>
          <ListItemIcon>
            {selectedProduct?.status === 'active' ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedProduct?.status === 'active' ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAdminAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Product</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default React.memo(ProductGrid); 