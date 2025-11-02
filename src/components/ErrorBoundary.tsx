import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We encountered an unexpected error. Please try refreshing the page.
              </Typography>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details (Development):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  backgroundColor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 