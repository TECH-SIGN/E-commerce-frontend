import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  AttachMoney,
  Visibility,
  ShoppingCart,
  Category,
} from '@mui/icons-material';
import api from '../../services/api';

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalValue: number;
  averagePrice: number;
  categories: { [key: string]: number };
  recentProducts: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    created_at: string;
  }>;
}

const ProductAnalytics: React.FC = () => {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products?mine=true&limit=1000');
      const products = response.data.products || response.data;
      
      const totalProducts = products.length;
      const activeProducts = products.filter((p: any) => p.status === 'active').length;
      const outOfStockProducts = products.filter((p: any) => p.stock === 0).length;
      const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 10).length;
      const totalValue = products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0);
      const averagePrice = totalProducts > 0 ? products.reduce((sum: number, p: any) => sum + p.price, 0) / totalProducts : 0;
      
      const categories: { [key: string]: number } = {};
      products.forEach((p: any) => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });
      
      const recentProducts = products
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setStats({
        totalProducts,
        activeProducts,
        outOfStockProducts,
        lowStockProducts,
        totalValue,
        averagePrice,
        categories,
        recentProducts,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No data available
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Product Analytics
      </Typography>
      
      <Button
        variant="outlined"
        onClick={fetchStats}
        sx={{ mb: 3 }}
      >
        Refresh Data
      </Button>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Inventory />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Products"
            value={stats.activeProducts}
            icon={<TrendingUp />}
            color="success"
            subtitle={`${((stats.activeProducts / stats.totalProducts) * 100).toFixed(1)}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockProducts}
            icon={<ShoppingCart />}
            color="error"
            subtitle={`${((stats.outOfStockProducts / stats.totalProducts) * 100).toFixed(1)}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock"
            value={stats.lowStockProducts}
            icon={<Visibility />}
            color="warning"
            subtitle="≤ 10 items"
          />
        </Grid>
      </Grid>

      {/* Financial Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Overview
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Inventory Value:</Typography>
                  <Typography fontWeight="bold" color="primary">
                    ₹{stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Average Product Price:</Typography>
                  <Typography fontWeight="bold">
                    ₹{stats.averagePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Stock Utilization:</Typography>
                  <Typography fontWeight="bold">
                    {((stats.activeProducts / stats.totalProducts) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Categories Distribution
              </Typography>
              <Stack spacing={1}>
                {Object.entries(stats.categories)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <Box key={category} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{category}</Typography>
                      <Chip 
                        label={count} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Products */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recently Added Products
          </Typography>
          <Grid container spacing={2}>
            {stats.recentProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${product.price} • Stock: {product.stock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Added: {new Date(product.created_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductAnalytics; 