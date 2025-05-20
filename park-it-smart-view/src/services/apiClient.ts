import axios from 'axios';
import logger from '../utils/logger';

// API Base URL - typically this would come from environment variables
// but for simplicity, we'll hardcode it for development
const API_BASE_URL = 'http://localhost:5000/api';

// Create an Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
      { params: config.params });
    return config;
  },
  (error) => {
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status}`, 
      { data: response.data });
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      logger.error(`API Error: ${status}`, { 
        url: error.config?.url,
        method: error.config?.method,
        data: data
      });
      
      // Handle authentication errors
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page if we have access to window
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else {
      logger.error('Network or other API error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 