import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  AttachMoney,
  TrendingUp,
  Analytics,
  Add as AddIcon,
  Visibility,
  Edit,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  labels: string[];
  revenueSeries: number[];
  ordersSeries: number[];
  recentProducts: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    created_at: string;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        api.get('/api/products/mine?limit=1000'),
        api.get('/api/orders?mine=true&limit=1000')
      ]);

      const products = productsRes.data.products || productsRes.data;
      const orders = ordersRes.data.orders || ordersRes.data;

      const totalProducts = products.length;
      const activeProducts = products.filter((p: any) => p.status === 'active').length;
      const outOfStockProducts = products.filter((p: any) => p.stock === 0).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total ?? o.totalAmount ?? o.total_amount ?? 0)), 0);

      // Build last 14 days series
      const days = 14;
      const labels: string[] = [];
      const revenueSeries: number[] = [];
      const ordersSeries: number[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const label = d.format('DD MMM');
        labels.push(label);
        const sameDayOrders = orders.filter((o: any) => {
          const ts = o.created_at || o.createdAt || o.date;
          return dayjs(ts).isSame(d, 'day');
        });
        const dayRevenue = sameDayOrders.reduce((s: number, o: any) => s + Number(o.total ?? o.totalAmount ?? o.total_amount ?? 0), 0);
        revenueSeries.push(dayRevenue);
        ordersSeries.push(sameDayOrders.length);
      }

      const recentProducts = products
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        labels,
        revenueSeries,
        ordersSeries,
        recentProducts,
        recentOrders,
      });
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Tiny sparkline component (inline SVG) with gradient fill
  const Sparkline: React.FC<{ data: number[]; color: string; height?: number; strokeWidth?: number }> = ({ data, color, height = 48, strokeWidth = 2 }) => {
    const width = 180;
    const max = Math.max(1, ...data);
    const min = Math.min(0, ...data);
    const len = Math.max(1, data.length - 1);
    const points = data.map((v, i) => {
      const x = (i / len) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    }).join(' ');
    const lastX = len > 0 ? (len / len) * width : 0;
    const lastY = height - ((data[data.length - 1] - min) / (max - min || 1)) * height;
    const gradientId = `grad-${color}`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill={`url(#${gradientId})`}
          stroke="none"
          points={`0,${height} ${points} ${width},${height}`}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          points={points}
          style={{ color: 'inherit' }}
        />
        <circle cx={lastX} cy={lastY} r={3.5} fill="currentColor" />
      </svg>
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle, onClick, chart }: any) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
        transition: 'all 0.2s ease-in-out',
        borderRadius: 3,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h4" component="div" fontWeight="bold" color={color}>
                {value}
              </Typography>
            </motion.div>
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
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
        {chart && (
          <Box mt={1.5} display="flex" justifyContent="flex-end" color={`${color}.main`}>
            {chart}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick }: any) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        transition: 'all 0.2s ease-in-out',
        borderRadius: 3,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            mb: 2,
            display: 'inline-block',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading admin dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome back, {user?.firstName || 'Admin'}! 👋
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's what's happening with your store today
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchStats}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}  md={6}>
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={<Inventory />}
            color="primary"
            subtitle={`${stats?.activeProducts || 0} active`}
            onClick={() => navigate('/admin/products')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Out of Stock"
            value={stats?.outOfStockProducts || 0}
            icon={<TrendingUp />}
            color="error"
            subtitle="Needs attention"
            onClick={() => navigate('/admin/products?inStock=false')}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Revenue"
            value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={<AttachMoney />}
            color="warning"
            subtitle={stats ? `${stats.labels[0]} - ${stats.labels[stats.labels.length - 1]}` : 'Total earnings'}
            chart={<Sparkline data={stats?.revenueSeries || []} color="warning" />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Orders"
            value={`${stats?.totalOrders || 0}`}
            icon={<ShoppingCart />}
            color="success"
            subtitles={[
              `${stats?.pendingOrders || 0} pending`,
              stats ? `${stats.labels[0]} - ${stats.labels[stats.labels.length - 1]}` : 'Last 14 days'
            ]}
            chart={<Sparkline data={stats?.ordersSeries || []} color="success" />}
            onClick={() => navigate('/admin/orders')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Add Product"
            description="Create a new product for your store"
            icon={<AddIcon />}
            color="primary"
            onClick={() => navigate('/admin/products/new')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Manage Products"
            description="View and edit your product catalog"
            icon={<Inventory />}
            color="success"
            onClick={() => navigate('/admin/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="View Orders"
            description="Check and manage customer orders"
            icon={<ShoppingCart />}
            color="warning"
            onClick={() => navigate('/admin/orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Analytics"
            description="View detailed store analytics"
            icon={<Analytics />}
            color="info"
            onClick={() => navigate('/admin')}
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2}>
        {/* Recent Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Products
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/products')}>
                  View All
                </Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <List>
                  {stats?.recentProducts.map((product, index) => (
                    <React.Fragment key={product.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Inventory />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={product.name}
                          secondary={`$${product.price} • Stock: ${product.stock}`}
                        />
                        <Box>
                          <IconButton size="small" onClick={() => navigate(`/admin/products/${product.id}`)}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" onClick={() => navigate(`/products/${product.id}`)}>
                            <Visibility />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < stats.recentProducts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                {(stats?.recentProducts?.length ?? 0) > 5 && (
                  <Chip
                    label={`+${(stats?.recentProducts?.length ?? 0) - 5} more`}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Orders
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/orders')}>
                  View All
                </Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <List>
                  {stats?.recentOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <ShoppingCart />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={`Order #${order.id.slice(-8)}`}
                          secondary={`${order.customerName} • $${order.total}`}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={order.status}
                            size="small"
                            color={order.status === 'pending' ? 'warning' : 'success'}
                          />
                          <IconButton size="small" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                            <Visibility />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < stats.recentOrders.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                {(stats?.recentOrders?.length ?? 0) > 5 && (
                  <Chip
                    label={`+${(stats?.recentOrders?.length ?? 0) - 5} more`}
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Store Information */}
      <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Store Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Store Name: <strong>Your E-commerce Store</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin Email: <strong>{user?.email}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Total Products: <strong>{stats?.totalProducts}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Orders: <strong>{stats?.totalOrders}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminHome; 