import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on mount
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await apiClient.get('/admin/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.data.authenticated) {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/admin/login', {
        username,
        password,
      });
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('adminToken', newToken);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error messages
      if (error.response?.status === 500) {
        return {
          success: false,
          message: 'Backend server error. Please ensure admin routes are deployed on the server.',
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Admin login route not found. Please add admin routes to your backend.',
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  const value = {
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
