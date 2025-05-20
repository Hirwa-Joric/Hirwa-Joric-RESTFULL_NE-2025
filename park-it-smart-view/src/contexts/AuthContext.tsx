import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { authService, User, LoginCredentials, RegisterData } from '../services';
import logger from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          // Verify the token by getting the user profile
          const userProfile = await authService.getProfile();
          setUser(userProfile);
          logger.info('User authenticated from stored credentials');
        } catch (error) {
          // If there's an error, the token is likely invalid
          logger.error('Error verifying authentication:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      logger.info(`Attempting login for user: ${email}`);
      
      const credentials: LoginCredentials = { email, password };
      const response = await authService.login(credentials);
      
      logger.debug('Login response:', response);
      
      // Make sure we have a valid user object and token
      if (!response || !response.user || !response.token) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      logger.info('Login successful');
      toast.success("Login successful");
      
      // Redirect based on role
      if (user.role && user.role.toLowerCase() === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/attendant/dashboard');
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      logger.info('Attempting to register user:', userData.email);
      
      const response = await authService.register(userData);
      logger.debug('Register response:', response);
      
      toast.success("Registration successful, please login");
      navigate('/login');
    } catch (error: any) {
      logger.error('Register error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logger.info('User logging out');
    authService.logout();
    setUser(null);
    toast.info("You have been logged out");
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
