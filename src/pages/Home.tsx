import React from 'react';
import { Typography, Box } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to E-commerce
      </Typography>
      <Typography variant="body1" paragraph>
        Browse our products and find the best deals!
      </Typography>
    </Box>
  );
};

export default Home; 