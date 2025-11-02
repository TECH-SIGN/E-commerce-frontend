import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AccountCircle, ShoppingCart } from '@mui/icons-material';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar: React.FC = () => {
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleProfileMenuClose();
    navigate('/login');
  };

  const menuItems = user?.role === 'admin' ? [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Orders', path: '/admin/orders' },
    { label: 'Users', path: '/admin/users' },
  ] : [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    ...(isAuthenticated ? [{ label: 'Orders', path: '/orders' }] : []),
  ];

  const authMenuItems = [
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
    { label: 'Store', path: '/store' },
    { label: 'Store Login', path: '/store/login' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Logo removed as per request */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          E-commerce
        </Typography>
        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    handleMobileMenuClose();
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
              {!isAuthenticated && (
                <>
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                      Account
                    </Typography>
                  </MenuItem>
                  {authMenuItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        handleMobileMenuClose();
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </>
              )}
              {isAuthenticated && user?.role !== 'admin' && (
                <MenuItem
                  onClick={() => {
                    navigate('/cart');
                    handleMobileMenuClose();
                  }}
                >
                  Cart
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </Button>
            ))}
            {isAuthenticated && (
              <Button color="inherit" component={RouterLink} to="/settings">
                Settings
              </Button>
            )}
          </Box>
        )}
        {user?.role !== 'admin' && (
          <IconButton component={RouterLink} to="/cart" color="inherit">
            <Badge badgeContent={items.length} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
        )}
        {isAuthenticated ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  navigate('/profile');
                }}
              >
                Profile
              </MenuItem>
              {user && user.role === 'admin' && (
                <>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      navigate('/admin');
                    }}
                  >
                    Dashboard
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      navigate('/admin/products');
                    }}
                  >
                    Manage Products
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      navigate('/admin/orders');
                    }}
                  >
                    Manage Orders
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      navigate('/admin/users');
                    }}
                  >
                    Manage Users
                  </MenuItem>
                </>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/store"
              sx={{ 
                border: '1px solid rgba(255,255,255,0.3)', 
                borderRadius: 1,
                ml: 1
              }}
            >
              Store
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
