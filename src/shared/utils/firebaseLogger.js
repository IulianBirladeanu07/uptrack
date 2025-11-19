import { logger as rnLogger, consoleTransport } from 'react-native-logs';

// Define log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Current log level (can be changed at runtime)
let currentLogLevel = LOG_LEVELS.DEBUG;

// Order of log levels for filtering
const LOG_LEVEL_ORDER = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3,
};

// Map our log levels to react-native-logs severity levels
const SEVERITY_MAP = {
  [LOG_LEVELS.DEBUG]: 'debug',
  [LOG_LEVELS.INFO]: 'info',
  [LOG_LEVELS.WARN]: 'warn',
  [LOG_LEVELS.ERROR]: 'error',
};

/**
 * Sets the current log level dynamically
 * @param {string} level - One of DEBUG, INFO, WARN, ERROR
 */
const setLogLevel = (level) => {
  if (LOG_LEVELS[level]) {
    currentLogLevel = LOG_LEVELS[level];
  } else {
    console.error(`Invalid log level: ${level}`);
  }
};

/**
 * Determines if a log should be displayed based on current log level
 * @param {string} level - Log level
 * @returns {boolean} True if log should be displayed
 */
const shouldLog = (level) => LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLogLevel];

/**
 * Formats timestamp in UTC with milliseconds
 * @returns {string} formatted timestamp
 */
const getFormattedTimestamp = () => {
  const now = new Date();
  
  // Format: HH:MM:SS.mmm UTC
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const seconds = now.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = now.getUTCMilliseconds().toString().padStart(3, '0');
  
  return `${hours}:${minutes}:${seconds}.${milliseconds} UTC`;
};

// Configure react-native-logs - let it handle colors but not formatting
const config = {
  severity: 'debug',
  transport: consoleTransport,
  transportOptions: {
    // Let react-native-logs handle colors directly
    colors: {
      debug: 'cyan',
      info: 'green',
      warn: 'yellow',
      error: 'red'
    }
  },
  // Turn off built-in formatting
  dateFormat: false,
  printLevel: false,
  printDate: false,
  printTime: false,
};

// Create react-native-logs logger
const baseLogger = rnLogger.createLogger(config);

/**
 * Extracts file path information from a message if present
 * @param {string} message - Original message that might contain file path
 * @returns {{cleanMessage: string, filePath: string|null}} Extracted info
 */
const extractFilePath = (message) => {
  const pathMatch = message.match(/\s*\[([^\]]+:\d+)\]\s*$/);
  if (pathMatch) {
    // Return the clean message and the file path
    return {
      cleanMessage: message.replace(/\s*\[[^\]]+:\d+\]\s*$/, '').trim(),
      filePath: pathMatch[1]
    };
  }
  return { cleanMessage: message, filePath: null };
};

// Custom logger implementation
const logger = {
  debug: (message) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      const timestamp = getFormattedTimestamp();
      
      // Format the message if it's an object
      const formattedMessage = typeof message === 'object' && message !== null
        ? JSON.stringify(message, null, 2)  // Pretty print with 2 space indentation
        : String(message);
      
      const { cleanMessage, filePath } = extractFilePath(formattedMessage);
      
      if (filePath) {
        baseLogger.debug(`${timestamp} | ${LOG_LEVELS.DEBUG} [ ${filePath} ]: ${cleanMessage}`);
      } else {
        baseLogger.debug(`${timestamp} | ${LOG_LEVELS.DEBUG}: ${cleanMessage}`);
      }
    }
  },

info: (message, data) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      const timestamp = getFormattedTimestamp();
      const { cleanMessage, filePath } = extractFilePath(message);
      
      let logMessage = cleanMessage;
      if (data !== undefined) {
        // Handle object data by stringifying it
        if (typeof data === 'object') {
          logMessage += ' ' + JSON.stringify(data);
        } else {
          logMessage += ' ' + data;
        }
      }
      
      if (filePath) {
        baseLogger.info(`${timestamp} | ${LOG_LEVELS.INFO} [${filePath}]: ${logMessage}`);
      } else {
        baseLogger.info(`${timestamp} | ${LOG_LEVELS.INFO}: ${logMessage}`);
      }
    }
  },
  warn: (message) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      const timestamp = getFormattedTimestamp();
      const { cleanMessage, filePath } = extractFilePath(message);
      
      if (filePath) {
        baseLogger.warn(`${timestamp} | ${LOG_LEVELS.WARN} [${filePath}]: ${cleanMessage}`);
      } else {
        baseLogger.warn(`${timestamp} | ${LOG_LEVELS.WARN}: ${cleanMessage}`);
      }
    }
  },

  error: (message, error) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      const timestamp = getFormattedTimestamp();
      const { cleanMessage, filePath } = extractFilePath(message);
      
      if (filePath) {
        baseLogger.error(`${timestamp} | ${LOG_LEVELS.ERROR} [${filePath}]: ${cleanMessage}`);
      } else {
        baseLogger.error(`${timestamp} | ${LOG_LEVELS.ERROR}: ${cleanMessage}`);
      }
      
      if (error) {
        baseLogger.error(error);
      }
    }
  },
};

export { logger, setLogLevel, LOG_LEVELS };