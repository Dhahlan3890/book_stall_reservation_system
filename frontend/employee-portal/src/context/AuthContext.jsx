import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedEmployee = localStorage.getItem('employee');

    if (storedToken) {
      setToken(storedToken);
      if (storedEmployee) {
        setEmployee(JSON.parse(storedEmployee));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.employeeLogin(email, password);
      setToken(response.data.access_token);
      setEmployee(response.data.employee);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('employee', JSON.stringify(response.data.employee));
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setEmployee(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('employee');
  };

  return (
    <AuthContext.Provider value={{
      employee,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
