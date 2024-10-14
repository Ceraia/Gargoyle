import fs from 'fs';
import path from 'path';

// Log levels mapping
const LOG_LEVELS = {
    NONE: 0,
    FATAL: 1,
    ERROR: 2,
    WARNING: 3,
    INFO: 4,
    DEBUG: 5,
    TRACE: 6,
};

const currentLogLevel = parseInt(process.env.DEBUG_LEVEL || '4', 10); // Default to INFO (4)
const logToFile = process.env.LOG_TO_FILE === 'true';

function getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.resolve('./log',`${date}.log`); 
}

function formatLogMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}

function writeToLogFile(logMessage: string): void {
    if (!logToFile) return;
    const logFilePath = getLogFilePath(); 
    fs.appendFileSync(logFilePath, logMessage + '\n', 'utf8');
}

// Logging functions with file writing capability
function log(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
        const logMessage = formatLogMessage('INFO', message);
        console.log(`\x1b[32m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

function debug(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
        const logMessage = formatLogMessage('DEBUG', message);
        console.log(`\x1b[33m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

function trace(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.TRACE) {
        const logMessage = formatLogMessage('TRACE', message);
        console.log(`\x1b[36m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

function error(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
        const logMessage = formatLogMessage('ERROR', message);
        console.log(`\x1b[31m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

function warning(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.WARNING) {
        const logMessage = formatLogMessage('WARNING', message);
        console.log(`\x1b[33m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

function fatal(message: string): void {
    if (currentLogLevel >= LOG_LEVELS.FATAL) {
        const logMessage = formatLogMessage('FATAL', message);
        console.log(`\x1b[35m${logMessage}\x1b[0m`);
        writeToLogFile(logMessage);
    }
}

class Logger {
    public static log(message: string): void {
        log(message);
    }

    public static debug(message: string): void {
        debug(message);
    }

    public static trace(message: string): void {
        trace(message);
    }

    public static error(message: string): void {
        error(message);
    }

    public static warning(message: string): void {
        warning(message);
    }

    public static fatal(message: string): void {
        fatal(message);
    }
}

export { Logger, log, debug, trace, error, warning, fatal };
