import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, CircularProgress, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<{ email: string; firstName: string; lastName: string; role: string }>({ 
    email: '', 
    firstName: '', 
    lastName: '', 
    role: 'user' 
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/users', form);
      setSuccess('User added successfully');
      setOpenAdd(false);
      setForm({ email: '', firstName: '', lastName: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/admin/users/${selectedUser.id}/role`, { role: form.role });
      setSuccess('User role updated successfully');
      setOpenEdit(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/users/${deleteId}`);
      setSuccess('User deleted successfully');
      setDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>User Management (Admin Only)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>Add User</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`.trim() || 'N/A'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => { setSelectedUser(user); setForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }); setOpenEdit(true); }}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(user.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add User Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <form onSubmit={handleAddUser}>
          <DialogContent>
            <TextField 
              label="Email" 
              name="email" 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              required 
              fullWidth 
              sx={{ mb: 2 }} 
            />
            <TextField 
              label="First Name" 
              name="firstName" 
              value={form.firstName} 
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} 
              fullWidth 
              sx={{ mb: 2 }} 
            />
            <TextField 
              label="Last Name" 
              name="lastName" 
              value={form.lastName} 
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} 
              fullWidth 
              sx={{ mb: 2 }} 
            />
            <Select 
              label="Role" 
              name="role" 
              value={form.role} 
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))} 
              fullWidth 
              required
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Role Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <form onSubmit={handleEditUser}>
          <DialogContent>
            <Typography>Name: {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() || selectedUser.email : ''}</Typography>
            <Typography>Email: {selectedUser?.email}</Typography>
            <Select 
              label="Role" 
              name="role" 
              value={form.role} 
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))} 
              fullWidth 
              required 
              sx={{ mt: 2 }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Are you sure you want to delete this user?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteUser}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers; 