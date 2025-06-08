import { toast } from 'react-toastify';
import { ApiError } from '../types';

export const handleApiError = (error: any): ApiError => {
  const apiError: ApiError = {
    message: 'An unexpected error occurred',
    status: 500,
  };

  if (error.response) {
    apiError.message = error.response.data?.message || error.response.statusText;
    apiError.status = error.response.status;
    apiError.code = error.response.data?.code;
  } else if (error.request) {
    apiError.message = 'Network error - please check your connection';
    apiError.status = 0;
  } else {
    apiError.message = error.message;
  }

  // Show error toast by default
  toast.error(apiError.message);

  return apiError;
};

export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}; 