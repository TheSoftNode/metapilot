"use strict";
/**
 * Advanced Logging System for AI Engine
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const winston_1 = __importDefault(require("winston"));
function createLogger(level = 'info') {
    const logger = winston_1.default.createLogger({
        level,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
            if (Object.keys(meta).length > 0) {
                logMessage += ` ${JSON.stringify(meta)}`;
            }
            if (stack) {
                logMessage += `\n${stack}`;
            }
            return logMessage;
        })),
        transports: [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ]
    });
    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
        logger.add(new winston_1.default.transports.File({
            filename: 'logs/ai-engine-error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }));
        logger.add(new winston_1.default.transports.File({
            filename: 'logs/ai-engine-combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }));
    }
    return logger;
}
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map