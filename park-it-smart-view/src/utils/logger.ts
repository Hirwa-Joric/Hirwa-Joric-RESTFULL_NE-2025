/**
 * Simple logging utility for debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Set to true to enable debug logging
const DEBUG_ENABLED = true;

/**
 * Log a message with the given level
 */
export const log = (level: LogLevel, message: string, data?: any) => {
  if (level === 'debug' && !DEBUG_ENABLED) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (data) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
};

/**
 * Log a debug message
 */
export const debug = (message: string, data?: any) => {
  log('debug', message, data);
};

/**
 * Log an info message
 */
export const info = (message: string, data?: any) => {
  log('info', message, data);
};

/**
 * Log a warning message
 */
export const warn = (message: string, data?: any) => {
  log('warn', message, data);
};

/**
 * Log an error message
 */
export const error = (message: string, data?: any) => {
  log('error', message, data);
};

export default {
  log,
  debug,
  info,
  warn,
  error
}; 