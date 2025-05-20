import apiClient from './apiClient';
import logger from '../utils/logger';

// Types for authentication
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Backend response interfaces
interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Map frontend roles to backend roles
const mapRoleToBackend = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'Admin': 'admin',
    'Attendant': 'parking_attendant'
  };
  return roleMap[role] || role;
};

// Map backend roles to frontend roles
const mapRoleToFrontend = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'admin': 'Admin',
    'parking_attendant': 'Attendant'
  };
  return roleMap[role] || role;
};

// Authentication services
const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      logger.info(`Attempting login for user: ${credentials.email}`);
      logger.debug('Login payload:', credentials);
      
      const response = await apiClient.post<BackendResponse<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        token: string;
      }>>('/users/login', credentials);
      
      logger.debug('Login response received:', response.data);
      
      // Extract user and token from the backend response structure
      const { data } = response.data;
      
      if (!data) {
        throw new Error('Invalid response from server: missing data');
      }
      
      const { token, ...userData } = data;
      
      // Convert backend role to frontend format
      const frontendRole = mapRoleToFrontend(userData.role);
      
      // Store the token in localStorage for authenticated requests
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({...userData, role: frontendRole}));
      
      // Return in the format expected by the AuthContext
      return {
        user: {
          ...userData,
          role: frontendRole
        } as User,
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      // Add fallback login for development (if backend is not accessible)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Using fallback login in development mode');
        
        // Check if credentials match our test admin user
        if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
          const mockUser = {
            id: '1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            role: 'Admin'
          };
          
          const mockToken = 'mock-jwt-token-for-development';
          
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
          
          return {
            user: mockUser,
            token: mockToken
          };
        }
      }
      
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      logger.info(`Attempting to register user: ${userData.email}`);
      
      // Map the role to the format expected by the backend
      const backendUserData = {
        ...userData,
        role: mapRoleToBackend(userData.role)
      };
      
      logger.debug('Sending registration data:', backendUserData);
      
      const response = await apiClient.post<BackendResponse<any>>('/users/register', backendUserData);
      
      logger.info('Registration successful');
      return { 
        success: response.data.success,
        message: response.data.message || 'Registration successful'
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    try {
      // If we are in development and using the specific mock token,
      // return the mock user from localStorage directly.
      // This avoids a backend call that would fail with the mock token.
      if (process.env.NODE_ENV === 'development') {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token === 'mock-jwt-token-for-development' && storedUser) {
          logger.debug('Using mock user profile in development from localStorage');
          // Ensure the role is mapped correctly if it wasn't stored in frontend format already
          const parsedUser = JSON.parse(storedUser) as User;
          return {
            ...parsedUser,
            role: mapRoleToFrontend(parsedUser.role) // Ensure role consistency
          };
        }
      }

      const response = await apiClient.get<BackendResponse<User>>('/users/profile');
      
      // Map the role from backend to frontend format
      const user = response.data.data;
      return {
        ...user,
        role: mapRoleToFrontend(user.role)
      };
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<BackendResponse<User>>('/users/profile', profileData);
    return response.data.data;
  },

  // Change password
  changePassword: async (
    data: { currentPassword: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<BackendResponse<any>>('/users/change-password', data);
    return { 
      success: response.data.success,
      message: response.data.message || 'Password changed successfully'
    };
  },

  // Logout (client-side only, no API call needed)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService; 