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
    TRACE: 6
};

const currentLogLevel = parseInt(process.env.DEBUG_LEVEL || '4', 10); // Default to INFO (4)
const logToFile = process.env.LOG_TO_FILE === 'true';

function getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.resolve('./log', `${date}.log`);
}

function formatLogMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}

function writeToLogFile(logMessage: string): void {
    if (!logToFile) return;
    const logFilePath = getLogFilePath();
    fs.appendFileSync(logFilePath, `${logMessage}\n`, 'utf8');
}

// Logging functions with file writing capability
function log(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('INFO', message);
            console.log(`\x1b[32m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}

function debug(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('DEBUG', message);
            console.log(`\x1b[33m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}

function trace(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.TRACE) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('TRACE', message);
            console.log(`\x1b[36m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}

function error(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('ERROR', message);
            console.log(`\x1b[31m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}

function warning(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.WARNING) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('WARNING', message);
            console.log(`\x1b[33m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}

function fatal(...messages: string[]): void {
    if (currentLogLevel >= LOG_LEVELS.FATAL) {
        messages.forEach(message => {
            const logMessage = formatLogMessage('FATAL', message);
            console.log(`\x1b[31m${logMessage}\x1b[0m`);
            writeToLogFile(logMessage);
        });
    }
}


class Logger {
    public static log(...messages: string[]): void {
        log(...messages);
    }

    public static debug(...messages: string[]): void {
        debug(...messages);
    }

    public static trace(...messages: string[]): void {
        trace(...messages);
    }

    public static error(...messages: string[]): void {
        error(...messages);
    }

    public static warning(...messages: string[]): void {
        warning(...messages);
    }

    public static fatal(...messages: string[]): void {
        fatal(...messages);
    }
}

export { Logger, log, debug, trace, error, warning, fatal };
