import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const TermsOfService: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using this e-commerce platform, you accept and agree to be bound by the terms and provision of this agreement.
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. Use License
          </Typography>
          <Typography variant="body1" paragraph>
            Permission is granted to temporarily download one copy of the materials (information or software) on this e-commerce platform for personal, non-commercial transitory viewing only.
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. User Account
          </Typography>
          <Typography variant="body1" paragraph>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Product Information
          </Typography>
          <Typography variant="body1" paragraph>
            We strive to provide accurate product information, but we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. Payment and Billing
          </Typography>
          <Typography variant="body1" paragraph>
            By providing a credit card or other payment method, you represent and warrant that you have the legal right to use the payment method and that the information you provide is true and complete.
          </Typography>

          <Typography variant="h6" gutterBottom>
            6. Shipping and Delivery
          </Typography>
          <Typography variant="body1" paragraph>
            Delivery times are estimates only. We are not responsible for delays beyond our control. Risk of loss and title for items pass to you upon delivery.
          </Typography>

          <Typography variant="h6" gutterBottom>
            7. Returns and Refunds
          </Typography>
          <Typography variant="body1" paragraph>
            Returns must be initiated within 30 days of delivery. Items must be unused and in original packaging. Refunds will be processed within 5-7 business days.
          </Typography>

          <Typography variant="h6" gutterBottom>
            8. Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform.
          </Typography>

          <Typography variant="h6" gutterBottom>
            9. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall the platform or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform.
          </Typography>

          <Typography variant="h6" gutterBottom>
            10. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </Typography>

          <Typography variant="h6" gutterBottom>
            11. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:ankitprajapati10027@gmail.com">ankitprajapati10027@gmail.com</a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService; 