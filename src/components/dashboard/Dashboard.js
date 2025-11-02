import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderStats } from '../../redux/slices/orderSlice';
import { fetchPaymentStats } from '../../redux/slices/paymentSlice';
import { fetchNotifications } from '../../redux/slices/notificationSlice';
import { fetchUserStats } from '../../redux/slices/userSlice';

const StatCard = ({ title, value, icon, loading }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="div">
            {loading ? <CircularProgress size={24} /> : value}
          </Typography>
        </Box>
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    orderStats,
    orderLoading
  } = useSelector((state) => state.orders);
  const {
    paymentStats,
    paymentLoading
  } = useSelector((state) => state.payments);
  const {
    notifications,
    loading: notificationLoading
  } = useSelector((state) => state.notifications);
  const {
    stats: userStats,
    loading: userLoading
  } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchOrderStats());
    dispatch(fetchPaymentStats());
    dispatch(fetchNotifications({ limit: 5 }));
    dispatch(fetchUserStats());
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={orderStats?.total || 0}
            icon={<OrderIcon color="primary" />}
            loading={orderLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(paymentStats?.total_amount || 0)}
            icon={<PaymentIcon color="primary" />}
            loading={paymentLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unread Notifications"
            value={notifications?.filter(n => !n.is_read).length || 0}
            icon={<NotificationIcon color="primary" />}
            loading={notificationLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={userStats?.active_users || 0}
            icon={<UserIcon color="primary" />}
            loading={userLoading}
          />
        </Grid>

        {/* Order Status */}
        <Grid item xs={12} md={6}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Order Status
              </Typography>
              <Divider />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Pending Orders"
                    secondary={orderStats?.pending || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Processing Orders"
                    secondary={orderStats?.processing || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Completed Orders"
                    secondary={orderStats?.completed || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Cancelled Orders"
                    secondary={orderStats?.cancelled || 0}
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Recent Notifications
              </Typography>
              <Divider />
              <List>
                {notificationLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress />
                  </Box>
                ) : notifications?.length > 0 ? (
                  notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem>
                        <ListItemText
                          primary={notification.title}
                          secondary={notification.message}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No recent notifications" />
                  </ListItem>
                )}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 