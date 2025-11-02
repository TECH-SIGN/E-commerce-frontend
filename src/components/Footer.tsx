import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 3,
        px: 2,
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 2,
          }}
        >
          {/* Copyright Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' },
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              &copy; {currentYear} Ankit Prajapati. All rights reserved.
            </Typography>
          </Box>

          {/* Links Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 1, sm: 3 },
            }}
          >
            <Link
              component={RouterLink}
              to="/terms-of-service"
              color="text.secondary"
              underline="hover"
              sx={{ textDecoration: 'none' }}
            >
              Terms of Service
            </Link>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Link
              href="/privacy-policy/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ textDecoration: 'none' }}
            >
              Privacy Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 