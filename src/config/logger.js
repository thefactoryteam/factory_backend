import pino from 'pino';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pinoPrettyPath = require.resolve('pino-pretty');

const levels = {
  emerg: 80,
  alert: 70,
  crit: 60,
  error: 50,
  warn: 40,
  notice: 30,
  info: 20,
  debug: 10
};

const logger = pino({
  name: 'factory_backend',
  level: process.env.LOG_LEVEL || 'info',
  customLevels: levels,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'secret', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => ({ level: label })
  },
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: pinoPrettyPath,
        options: {
          colorize: true
        }
      }
    : undefined
});

export default logger;
