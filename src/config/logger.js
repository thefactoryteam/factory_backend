import pino from "pino";

const levels = {
  emerg: 80,
  alert: 70,
  crit: 60,
  error: 50,
  warn: 40,
  notice: 30,
  info: 20,
  debug: 10,
};

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  name: "factory_backend",
  level: process.env.LOG_LEVEL || (isProduction ? "warn" : "debug"), // Default to 'warn' in production
  customLevels: levels,
  useOnlyCustomLevels: true, // Enforce custom levels
  timestamp: pino.stdTimeFunctions.isoTime, // ISO timestamp for consistency
  redact: {
    paths: ["password", "secret", "token", "authorization", "cookie"], // Redact sensitive fields
    censor: "[REDACTED]",
  },
  formatters: {
    level: (label) => ({ level: label }), // Format log levels
    bindings: () => ({}), // Remove pid and hostname from logs
    log: (object) => {
      // Remove unnecessary fields in production
      if (isProduction) {
        delete object.req?.headers;
        delete object.req?.remotePort;
      }
      return object;
    },
  },
  transport: !isProduction
    ? {
        target: "pino-pretty", // Pretty-print logs in non-production
        options: {
          colorize: true, // Add colors for better readability
          translateTime: true, // Human-readable timestamps
          ignore: "pid,hostname", // Remove unnecessary fields
        },
      }
    : undefined, // No transport in production for performance
});

export default logger;
