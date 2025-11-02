import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Storefront,
  Dashboard,
  Inventory,
  People,
  ShoppingCart,
  Analytics,
} from '@mui/icons-material';

const StoreLanding: React.FC = () => {
  const features = [
    {
      icon: <Dashboard sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Admin Dashboard',
      description: 'Comprehensive dashboard to manage your store operations',
    },
    {
      icon: <Inventory sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Product Management',
      description: 'Add, edit, and manage your product catalog with ease',
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Customer Management',
      description: 'View and manage customer accounts and orders',
    },
    {
      icon: <ShoppingCart sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Order Management',
      description: 'Track and manage customer orders in real-time',
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Analytics & Reports',
      description: 'Get insights into your store performance and sales',
    },
    {
      icon: <Storefront sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Store Customization',
      description: 'Customize your store appearance and settings',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Storefront sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Store Management Platform
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Manage your e-commerce store with powerful admin tools
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/store/login"
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Store Login
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/store/register"
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Register Store
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Store Features
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" paragraph>
          Everything you need to run your e-commerce business
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center', mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to Start?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Join thousands of store owners who trust our platform to manage their business
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/store/register"
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Get Started Now
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/store/login"
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Access Store
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StoreLanding; 