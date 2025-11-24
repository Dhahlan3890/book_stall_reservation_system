/**
 * Frontend debugging and error logging utilities
 * Provides comprehensive error tracking, request logging, and performance monitoring
 */

// Configure logging levels
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Current log level (change to LOG_LEVEL.WARN to reduce noise)
const CURRENT_LOG_LEVEL = LOG_LEVEL.DEBUG;

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m',    // Cyan
  info: '\x1b[32m',     // Green
  warn: '\x1b[33m',     // Yellow
  error: '\x1b[31m',    // Red
  success: '\x1b[35m',  // Magenta
};

class Logger {
  constructor(name) {
    this.name = name;
    this.logs = [];
  }

  shouldLog(level) {
    return level >= CURRENT_LOG_LEVEL;
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelStr = Object.keys(LOG_LEVEL).find(k => LOG_LEVEL[k] === level);
    const color = COLORS[levelStr.toLowerCase()];
    
    let msg = `[${timestamp}] [${this.name}] ${levelStr}: ${message}`;
    if (data) {
      msg += ` ${JSON.stringify(data, null, 2)}`;
    }
    
    return { msg, color, levelStr };
  }

  log(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const { msg, color } = this.formatMessage(level, message, data);
    console.log(`${color}${msg}${COLORS.reset}`);
    
    // Store in logs array for later inspection
    this.logs.push({
      timestamp: new Date(),
      level: Object.keys(LOG_LEVEL).find(k => LOG_LEVEL[k] === level),
      message,
      data,
    });
  }

  debug(message, data) {
    this.log(LOG_LEVEL.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVEL.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVEL.WARN, message, data);
  }

  error(message, data) {
    this.log(LOG_LEVEL.ERROR, message, data);
  }

  success(message, data) {
    console.log(`${COLORS.success}[SUCCESS] ${message}${COLORS.reset}`, data || '');
  }

  // Get all logs
  getLogs() {
    return this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// API request logger
class APILogger {
  constructor() {
    this.logger = new Logger('API');
    this.requests = [];
  }

  logRequest(method, url, config) {
    const request = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      method,
      url,
      headers: config?.headers,
      data: config?.data,
    };

    this.requests.push(request);
    this.logger.debug(`${method} ${url}`, { headers: config?.headers });
    
    return request.id;
  }

  logResponse(requestId, response) {
    const request = this.requests.find(r => r.id === requestId);
    if (request) {
      request.response = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        timestamp: new Date(),
        duration: new Date() - request.timestamp,
      };

      this.logger.success(`${request.method} ${request.url} [${response.status}]`, {
        duration: `${request.response.duration}ms`,
      });
    }
  }

  logError(requestId, error) {
    const request = this.requests.find(r => r.id === requestId);
    if (request) {
      request.error = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        timestamp: new Date(),
        duration: new Date() - request.timestamp,
      };

      this.logger.error(`${request.method} ${request.url} [${error.response?.status || 'UNKNOWN'}]`, {
        message: error.message,
        data: error.response?.data,
        duration: `${request.error.duration}ms`,
      });
    }
  }

  getRequests() {
    return this.requests;
  }

  getErrors() {
    return this.requests.filter(r => r.error);
  }
}

// Create global logger instances
export const logger = new Logger('App');
export const apiLogger = new APILogger();

// Error boundary helper
export class ErrorHandler {
  static handle(error, context = 'Unknown') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    logger.error(`Error in ${context}`, errorInfo);

    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (window.__ERROR_TRACKING__) {
      window.__ERROR_TRACKING__(errorInfo);
    }

    return errorInfo;
  }

  static handleAPIError(error) {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
    };

    logger.error('API Error', errorInfo);
    return errorInfo;
  }

  static handleAuthError(error) {
    logger.error('Authentication Error', {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data,
    });

    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    // Redirect to login
    window.location.href = '/login';
  }

  static handleNetworkError(error) {
    logger.error('Network Error', {
      message: error.message,
      isNetworkError: !error.response,
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.marks = {};
    this.logger = new Logger('Performance');
  }

  mark(name) {
    this.marks[name] = performance.now();
    this.logger.debug(`Mark: ${name}`);
  }

  measure(name, startMark) {
    if (this.marks[startMark]) {
      const duration = performance.now() - this.marks[startMark];
      this.logger.info(`Measure: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    }
  }

  getMetrics() {
    return {
      navigation: performance.getEntriesByType('navigation')[0],
      paints: performance.getEntriesByType('paint'),
      marks: this.marks,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Local storage debug helper
export class StorageDebugger {
  static inspect() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    logger.debug('LocalStorage Contents', data);
    return data;
  }

  static clear(confirm = true) {
    if (confirm) {
      logger.warn('Clearing localStorage...');
      localStorage.clear();
      logger.info('LocalStorage cleared');
    }
  }

  static getToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Try to decode JWT payload
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          logger.debug('JWT Payload', payload);
          return payload;
        }
      } catch (e) {
        logger.error('Failed to decode token', e.message);
      }
    }
    return null;
  }
}

// Export all for global access
export default {
  logger,
  apiLogger,
  ErrorHandler,
  PerformanceMonitor,
  StorageDebugger,
  performanceMonitor,
};
