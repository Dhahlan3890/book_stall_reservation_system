import axios from 'axios';
import { apiLogger, ErrorHandler, logger } from './debug';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

logger.info('Initializing API client', { baseURL: API_URL });

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
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
      localStorage.removeItem('user');
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

// Auth API
export const authAPI = {
  register: (data) => {
    logger.debug('Calling register', { email: data.email });
    return api.post('/auth/register', data);
  },
  login: (email, password) => {
    logger.debug('Calling login', { email });
    return api.post('/auth/login', { email, password });
  },
  getCurrentUser: () => {
    logger.debug('Calling getCurrentUser');
    return api.get('/auth/me');
  },
  updateProfile: (data) => {
    logger.debug('Calling updateProfile');
    return api.put('/auth/profile', data);
  },
  changePassword: (data) => {
    logger.debug('Calling changePassword');
    return api.post('/auth/change-password', data);
  },
  refreshToken: (token) => {
    logger.debug('Calling refreshToken');
    return api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Stall API
export const stallAPI = {
  getAllStalls: () => {
    logger.debug('Fetching all stalls');
    return api.get('/stalls');
  },
  getStall: (id) => {
    logger.debug('Fetching stall', { id });
    return api.get(`/stalls/${id}`);
  },
  getStallsBySize: (size) => {
    logger.debug('Fetching stalls by size', { size });
    return api.get(`/stalls/by-size/${size}`);
  },
  getStats: () => {
    logger.debug('Fetching stall stats');
    return api.get('/stalls/stats');
  },
};

// Reservation API
export const reservationAPI = {
  createReservation: (stallId, notes = '') => {
    logger.debug('Creating reservation', { stallId, notes });
    return api.post('/reservations', { stall_id: stallId, notes });
  },
  getUserReservations: () => {
    logger.debug('Fetching user reservations');
    return api.get('/reservations');
  },
  getReservation: (id) => {
    logger.debug('Fetching reservation', { id });
    return api.get(`/reservations/${id}`);
  },
  cancelReservation: (id) => {
    logger.debug('Cancelling reservation', { id });
    return api.post(`/reservations/${id}/cancel`);
  },
  getReservationQR: (id) => {
    logger.debug('Fetching QR code', { id });
    return api.get(`/reservations/${id}/qr`);
  },
};

// Genre API
export const genreAPI = {
  getAllGenres: () => {
    logger.debug('Fetching all genres');
    return api.get('/genres');
  },
  getUserGenres: () => {
    logger.debug('Fetching user genres');
    return api.get('/genres/user/genres');
  },
  addUserGenres: (genreIds) => {
    logger.debug('Adding user genres', { count: genreIds.length });
    return api.post('/genres/user/genres', { genre_ids: genreIds });
  },
  addGenre: (genreId) => {
    logger.debug('Adding genre', { genreId });
    return api.post(`/genres/user/genres/${genreId}`);
  },
  removeGenre: (genreId) => {
    logger.debug('Removing genre', { genreId });
    return api.delete(`/genres/user/genres/${genreId}`);
  },
};

export default api;