import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('optical_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error Toasting & Session Validation
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const response = error.response;
    const message = response?.data?.message || error.message || 'An unexpected error occurred.';

    if (response) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('optical_token');
          localStorage.removeItem('optical_user');
          // Simple delay redirect to allow user to see message
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
      toast.error(message);
    } else {
      toast.error('Network error: Cannot reach the backend server.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
