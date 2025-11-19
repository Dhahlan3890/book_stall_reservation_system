import axios from 'axios';
import { apiLogger, ErrorHandler, logger } from './debug';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

logger.info('Initializing API client (Employee Portal)', { baseURL: API_URL });

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const requestId = apiLogger.logRequest(config.method.toUpperCase(), config.url, config);
    config.requestId = requestId;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('Token added to request', { 
        url: config.url,
        tokenLength: token.length 
      });
    } else {
      logger.warn('No token found in localStorage for protected request', { url: config.url });
    }

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    apiLogger.logResponse(response.config.requestId, response);
    logger.debug('API Response', { 
      status: response.status,
      url: response.config.url 
    });
    return response;
  },
  (error) => {
    const errorInfo = ErrorHandler.handleAPIError(error);
    apiLogger.logError(error.config?.requestId, error);

    if (error.response?.status === 401) {
      logger.error('Unauthorized - Redirecting to login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('employee');
      window.location.href = '/login';
    } else if (error.response?.status === 422) {
      logger.error('Unprocessable Entity - Validation failed', {
        data: error.response?.data,
        url: error.config?.url,
      });
    } else if (!error.response) {
      logger.error('Network error - No response from server', {
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  employeeLogin: (email, password) => {
    logger.debug('Calling employee login', { email });
    return api.post('/auth/employee/login', { email, password });
  },
  getCurrentEmployee: () => {
    logger.debug('Calling getCurrentEmployee');
    return api.get('/auth/employee/me');
  },
};

export const employeeAPI = {
  getDashboard: () => {
    logger.debug('Fetching dashboard data');
    return api.get('/employee/dashboard');
  },
  getStalls: () => {
    logger.debug('Fetching employee stalls');
    return api.get('/employee/stalls');
  },
  getReservations: (status) => {
    logger.debug('Fetching employee reservations', { status });
    return api.get(`/employee/reservations${status ? `?status=${status}` : ''}`);
  },
  cancelReservation: (reservationId) => {
    logger.debug('Cancelling reservation (admin)', { reservationId });
    return api.post(`/employee/reservations/${reservationId}/cancel`);
  },
  approveReservation: (reservationId) => {
    logger.debug('Approving pending reservation', { reservationId });
    return api.post(`/employee/reservations/${reservationId}/approve`);
  },
  rejectReservation: (reservationId, reason) => {
    logger.debug('Rejecting pending reservation', { reservationId, reason });
    return api.post(`/employee/reservations/${reservationId}/reject`, { reason });
  },
  getUsers: () => {
    logger.debug('Fetching users');
    return api.get('/employee/users');
  },
  getUserDetails: (id) => {
    logger.debug('Fetching user details', { id });
    return api.get(`/employee/users/${id}`);
  },
  getOccupancyAnalytics: () => {
    logger.debug('Fetching occupancy analytics');
    return api.get('/employee/analytics/occupancy');
  },
  getRevenueAnalytics: () => {
    logger.debug('Fetching revenue analytics');
    return api.get('/employee/analytics/revenue');
  },
};

export default api;