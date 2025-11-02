import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Pagination,
  Stack,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  ShoppingCart,
  AttachMoney,
  Refresh as RefreshIcon,
  LocalShipping,
  CheckCircle,
  Cancel,
  Pending,
  Payment,
  Receipt,
  Person,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string; // formatted full address
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  items: Array<{
    productId: string;
    productName?: string;
    productImage?: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  status: string;
  paymentStatus: string;
  dateRange: string;
  sortBy: string;
}

// Strictly-typed status options for Orders
const STATUS_OPTIONS: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    paymentStatus: '',
    dateRange: '',
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, Order['status']>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  // product cache: id -> { name, image }
  const [productCache, setProductCache] = useState<Record<string, { name?: string; image?: string }>>({});
  // expanded chips per order id
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const pageSizeOptions = [6, 12, 18, 24, 30, 36];

  const formatAddress = (addr: any): string => {
    if (!addr || typeof addr !== 'object') return '';
    const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
      .map((x: any) => (x === null || x === undefined ? '' : String(x).trim()))
      .filter(Boolean);
    return parts.join(', ');
  };

  const mapOrderFromApi = (raw: any): Order => {
    const items = Array.isArray(raw.items) ? raw.items : [];
    const mappedItems = items.map((it: any) => ({
      productId: it.product_id || it.productId,
      productName: it.name || it.productName,
      quantity: Number(it.quantity) || 0,
      price: Number(it.price) || 0,
    }));
    return {
      id: raw.id,
      customerName: raw.customerName || raw.customer_name || 'N/A',
      customerEmail: raw.customerEmail || raw.customer_email || 'N/A',
      customerPhone: raw.customerPhone || raw.customer_phone || 'N/A',
      shippingAddress: raw.shippingAddress || formatAddress(raw.address),
      total: Number(
        raw.total ??
        raw.totalAmount ??
        raw.total_amount ??
        raw.originalAmount ??
        raw.amount ??
        0
      ),
      status: raw.status,
      paymentStatus: normalizePaymentStatus(raw.paymentStatus || raw.payment_status, raw),
      items: mappedItems,
      created_at: raw.created_at || raw.createdAt,
      updated_at: raw.updated_at || raw.updatedAt,
    } as Order;
  };

  // normalize payment status; if backend says 'online', treat as 'paid'
  const normalizePaymentStatus = (ps: string, raw: any): Order['paymentStatus'] => {
    const val = (ps || '').toLowerCase();
    const method = (raw?.paymentMethod || raw?.payment_method || '').toLowerCase();
    if (val === 'online' || method === 'online') return 'paid';
    if (val === 'paid' || val === 'success' || val === 'completed') return 'paid';
    if (val === 'failed') return 'failed';
    return 'pending';
  };

  const prefetchProducts = async (ordersList: Order[]) => {
    try {
      const ids = new Set<string>();
      ordersList.forEach(o => o.items.forEach(it => { if (it.productId && !productCache[it.productId]) ids.add(it.productId); }));
      if (ids.size === 0) return;
      const fetches = Array.from(ids).map(async (id) => {
        try {
          const res = await api.get(`/api/products/${id}`);
          const p = res.data || {};
          return { id, name: p.name, image: (p.images && p.images[0]) || p.image };
        } catch {
          return { id, name: undefined, image: undefined };
        }
      });
      const results = await Promise.all(fetches);
      setProductCache(prev => {
        const next = { ...prev } as Record<string, { name?: string; image?: string }>;
        results.forEach(r => { next[r.id] = { name: r.name, image: r.image }; });
        return next;
      });
    } catch (e) {
      // silent
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/orders/admin/my-products?page=${page}&limit=${pageSize}`);
      const data = response.data;
      const listRaw = data.orders || data.docs || data.items || data.data || data || [];
      const mapped: Order[] = listRaw.map(mapOrderFromApi);
      setOrders(mapped);
      setFilteredOrders(mapped);
      const serverTotal = Number(
        data.total ?? data.totalOrders ?? data.total_docs ?? data.totalDocs ?? data.count ?? data.totalCount ?? mapped.length
      );
      setTotalOrders(serverTotal);
      setTotalPages(Number(data.totalPages) || Math.max(1, Math.ceil(serverTotal / pageSize)));
      // prefetch product details for rendering
      prefetchProducts(mapped);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize]);

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value;
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, filters]);

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(order => new Date(order.created_at) >= cutoffDate);
    }

    // Sort
    switch (filters.sortBy) {
      case 'customer':
        filtered.sort((a, b) => a.customerName.localeCompare(b.customerName));
        break;
      case 'total-low':
        filtered.sort((a, b) => a.total - b.total);
        break;
      case 'total-high':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredOrders(filtered);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;
    
    try {
      if (bulkAction === 'process') {
        await Promise.all(selectedOrders.map(id => 
          api.patch(`/api/orders/${id}/status`, { status: 'processing' })
        ));
        toast.success(`${selectedOrders.length} orders marked as processing`);
      } else if (bulkAction === 'ship') {
        await Promise.all(selectedOrders.map(id => 
          api.patch(`/api/orders/${id}/status`, { status: 'shipped' })
        ));
        toast.success(`${selectedOrders.length} orders marked as shipped`);
      } else if (bulkAction === 'deliver') {
        await Promise.all(selectedOrders.map(id => 
          api.patch(`/api/orders/${id}/status`, { status: 'delivered' })
        ));
        toast.success(`${selectedOrders.length} orders marked as delivered`);
      }
      setSelectedOrders([]);
      setBulkAction('');
      setShowBulkDialog(false);
      fetchOrders();
    } catch (err: any) {
      toast.error('Failed to perform bulk action');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Map payment status to MUI chip colors
  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Track status changes before submitting update
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setStatusUpdates(prev => ({ ...prev, [orderId]: newStatus }));
  };

  // Persist status update to backend and update local state
  const handleUpdateStatus = async (orderId: string) => {
    const newStatus = statusUpdates[orderId];
    if (!newStatus) return;
    try {
      setUpdating(orderId);
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      // Update orders in place
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setFilteredOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      // If dialog is open for this order, sync selectedOrder as well
      setSelectedOrder(prev => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev));
      toast.success('Order status updated');
    } catch (e) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'processing': return <LocalShipping />;
      case 'shipped': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Pending />;
  }
};

  // Use server-side pagination results directly; do not slice again client-side
  const pagedOrders = filteredOrders; // already the current page from API

  return (
    <Box>

      {/* Toolbar: Search, Filters toggle, Bulk select, Refresh */}
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by customer, email, or order ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />

        <Button
          size="small"
          variant={showFilters ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters((s) => !s)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchOrders()}
        >
          Refresh
        </Button>

        <Box display="flex" alignItems="center" gap={1} ml="auto">
          <Checkbox
            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
            indeterminate={selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <Typography variant="body2" color="text.secondary">
            {selectedOrders.length} selected
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="bulk-action-label">Bulk Action</InputLabel>
            <Select
              labelId="bulk-action-label"
              label="Bulk Action"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="process">Mark as Processing</MenuItem>
              <MenuItem value="ship">Mark as Shipped</MenuItem>
              <MenuItem value="deliver">Mark as Delivered</MenuItem>
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="contained"
            disabled={!bulkAction || selectedOrders.length === 0}
            onClick={() => setShowBulkDialog(true)}
          >
            Apply
          </Button>
        </Box>
      </Box>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="status-filter-label">Order Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Order Status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {STATUS_OPTIONS.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="payment-filter-label">Payment Status</InputLabel>
                <Select
                  labelId="payment-filter-label"
                  label="Payment Status"
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  <MenuItem value="pending">pending</MenuItem>
                  <MenuItem value="paid">paid</MenuItem>
                  <MenuItem value="failed">failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="date-filter-label">Date Range</InputLabel>
                <Select
                  labelId="date-filter-label"
                  label="Date Range"
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>Any time</em>
                  </MenuItem>
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="sortby-filter-label">Sort By</InputLabel>
                <Select
                  labelId="sortby-filter-label"
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="total-low">Total: Low to High</MenuItem>
                  <MenuItem value="total-high">Total: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Orders Grid */}
      {pagedOrders.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {pagedOrders.map((order) => {
            const expanded = !!expandedItems[order.id];
            const itemsToShow = expanded ? order.items : order.items.slice(0, 3);
            return (
              <Grid item xs={12} md={6} lg={4} key={String(order.id)}>
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        #{String(order.id).slice(-8)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip size="small" icon={getStatusIcon(order.status)} label={order.status} color={getStatusColor(order.status) as any} />
                        <Chip size="small" icon={<Payment />} label={order.paymentStatus === 'paid' ? 'Completed' : (order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1))} color={getPaymentStatusColor(order.paymentStatus) as any} />
                      </Stack>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {order.customerName} • ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>

                    <Box mt={1} mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Items
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {itemsToShow.map((item, idx) => (
                          <Chip
                            key={`${item.productId}-${idx}`}
                            avatar={productCache[item.productId]?.image ? <Avatar src={productCache[item.productId]?.image} /> : undefined}
                            label={(productCache[item.productId]?.name || item.productName || 'Product') + ` × ${item.quantity}`}
                            onClick={() => navigate(`/products/${item.productId}`)}
                            clickable
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <Chip
                            size="small"
                            label={expanded ? 'Show less' : `+${order.items.length - 3} more`}
                            onClick={() => setExpandedItems(prev => ({ ...prev, [order.id]: !expanded }))}
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Shipping Address
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5, mt: 0.2 }} />
                        {order.shippingAddress || 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); setStatusUpdates(prev => ({ ...prev, [order.id]: order.status })); }}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Change Status">
                        <IconButton size="small" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); setStatusUpdates(prev => ({ ...prev, [order.id]: order.status })); }}>
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filters'
              : 'No orders have been placed yet'
            }
          </Typography>
        </Box>
      )}

      {/* Dynamic Pagination Controls */}
      {filteredOrders.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }} flexWrap="wrap" gap={2}>
          {/* Items per page selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Show:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                displayEmpty
                sx={{ height: 32 }}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              orders per page
            </Typography>
          </Box>

          {/* Results info using server totals */}
          <Typography variant="body2" color="text.secondary">
            {(() => {
              const startNum = totalOrders === 0 ? 0 : (page - 1) * pageSize + 1;
              const endNum = (page - 1) * pageSize + pagedOrders.length;
              return `Showing ${startNum} - ${endNum} of ${totalOrders} orders`;
            })()}
          </Typography>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          )}
        </Box>
      )}

      {/* Order Details Dialog */}
      <Dialog 
        open={showOrderDetails} 
        onClose={() => setShowOrderDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - #{selectedOrder ? String(selectedOrder.id).slice(-8) : ''}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>Customer Information</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Person /></ListItemIcon>
                        <ListItemText primary="Name" secondary={selectedOrder.customerName} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText primary="Email" secondary={selectedOrder.customerEmail} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText primary="Phone" secondary={selectedOrder.customerPhone} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><LocationOn /></ListItemIcon>
                        <ListItemText primary="Address" secondary={selectedOrder.shippingAddress} />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>Order Information</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Receipt /></ListItemIcon>
                        <ListItemText 
                          primary="Status" 
                          secondary={
                            <Chip 
                              label={selectedOrder.status} 
                              color={getStatusColor(selectedOrder.status) as any}
                              size="small"
                            />
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><RefreshIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Change Status"
                          secondary={
                            <FormControl size="small" sx={{ mt: 0.5, minWidth: 160 }}>
                              <InputLabel id="change-status-label">Status</InputLabel>
                              <Select
                                labelId="change-status-label"
                                label="Status"
                                value={statusUpdates[selectedOrder.id] || selectedOrder.status}
                                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as Order['status'])}
                              >
                                {STATUS_OPTIONS.map(s => (
                                  <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Payment /></ListItemIcon>
                        <ListItemText 
                          primary="Payment Status" 
                          secondary={
                            <Chip 
                              label={selectedOrder.paymentStatus === 'paid' ? 'Completed' : (selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1))} 
                              color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                              size="small"
                            />
                          } 
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon><AttachMoney /></ListItemIcon>
                        <ListItemText primary="Total" secondary={`₹${Number(selectedOrder.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><ShoppingCart /></ListItemIcon>
                        <ListItemText primary="Items" secondary={`${selectedOrder.items.length} item(s)`} />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>Order Items</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List dense>
                      {selectedOrder.items.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box onClick={() => navigate(`/products/${item.productId}`)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                                {productCache[item.productId]?.image && (
                                  <Avatar src={productCache[item.productId]?.image} sx={{ width: 28, height: 28 }} />
                                )}
                                <Typography variant="body2" color="primary">
                                  {productCache[item.productId]?.name || item.productName || 'View product'}
                                </Typography>
                              </Box>
                            }
                            secondary={`Quantity: ${item.quantity} • Price: ₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            ₹{Number(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDetails(false)}>Close</Button>
          <Button 
            variant="contained" 
            disabled={!!(selectedOrder && ((statusUpdates[selectedOrder.id] || selectedOrder.status) === selectedOrder.status)) || (updating === selectedOrder?.id)}
            onClick={async () => {
              if (!selectedOrder) return;
              await handleUpdateStatus(selectedOrder.id);
              setShowOrderDetails(false);
            }}
          >
            {updating === selectedOrder?.id ? 'Updating...' : 'Change Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)}>
        <DialogTitle>
          {bulkAction === 'process' ? 'Mark Orders as Processing' : 
           bulkAction === 'ship' ? 'Mark Orders as Shipped' : 'Mark Orders as Delivered'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to update {selectedOrders.length} order(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkDialog(false)}>Cancel</Button>
          <Button color="primary" onClick={handleBulkAction}>
            {bulkAction === 'process' ? 'Mark as Processing' : 
             bulkAction === 'ship' ? 'Mark as Shipped' : 'Mark as Delivered'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrderManagement; 