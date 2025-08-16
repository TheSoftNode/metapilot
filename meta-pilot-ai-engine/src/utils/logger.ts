/**
 * Advanced Logging System for AI Engine
 */

import winston from 'winston';

export function createLogger(level: string = 'info'): winston.Logger {
  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
          logMessage += `\n${stack}`;
        }
        
        return logMessage;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/ai-engine-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));
    
    logger.add(new winston.transports.File({
      filename: 'logs/ai-engine-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));
  }

  return logger;
}