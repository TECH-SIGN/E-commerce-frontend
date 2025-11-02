import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Button } from '@mui/material';
import { RootState } from '../store';

const DebugUser: React.FC = () => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  const decodeToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return { error: 'Failed to decode token' };
    }
  };

  const tokenPayload = decodeToken();

  return (
    <Box p={2}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Debug User Info</Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>User from Redux:</strong>
        </Typography>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
        
        <Typography variant="body2" gutterBottom>
          <strong>Token Payload:</strong>
        </Typography>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
          {JSON.stringify(tokenPayload, null, 2)}
        </pre>
        
        <Typography variant="body2" gutterBottom>
          <strong>User Role:</strong> {user?.role || 'No role'}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Token Role:</strong> {tokenPayload?.role || 'No role in token'}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Should Show Admin:</strong> {user?.role === 'admin' ? 'Yes' : 'No'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default DebugUser; 