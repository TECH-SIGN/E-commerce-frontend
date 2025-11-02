import React, { useState } from 'react';
import { Box, Typography, Button, Stack, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProductAnalytics from './ProductAnalytics';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Product Analytics" />
        <Tab label="Quick Actions" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Stack spacing={2} direction="row" sx={{ mb: 4 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/admin/products')}>
          Manage Products
        </Button>
        <Button variant="contained" color="secondary" onClick={() => navigate('/admin/users')}>
          Manage Users
        </Button>
        <Button variant="contained" color="info" onClick={() => navigate('/admin/orders')}>
          Manage Orders
        </Button>
            <Button variant="contained" color="success" onClick={() => navigate('/admin/products/new')}>
              Add New Product
            </Button>
          </Stack>
        </Box>
      )}

      {activeTab === 1 && (
        <ProductAnalytics />
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Stack spacing={2} direction="row" flexWrap="wrap">
            <Button variant="outlined" onClick={() => navigate('/admin/products/new')}>
              Add Product
            </Button>
            <Button variant="outlined" onClick={() => navigate('/admin/products')}>
              View All Products
            </Button>
            <Button variant="outlined" onClick={() => navigate('/admin/orders')}>
              View Orders
            </Button>
            <Button variant="outlined" onClick={() => navigate('/admin/users')}>
              Manage Users
            </Button>
      </Stack>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboard; 