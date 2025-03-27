import { WebhookClient } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Log levels mapping
const LOG_LEVELS = {
    NONE: 0, // Should not trace any data
    FATAL: 1, // Should trace fatal errors such as system crashes
    ERROR: 2, // Should trace errors such as exceptions
    WARNING: 3, // Should trace warnings such as deprecated commands or similar
    INFO: 4, // Should trace general data such as startup information
    DEBUG: 5, // Should trace system specific data, such as registration of commands or similar
    TRACE: 6 // Should trace user specific data, such as using commands or events
};

const currentLogLevel = parseInt(process.env.DEBUG_LEVEL || '4', 10); // Default to INFO (4)
const watchDogLevel = parseInt(process.env.WATCHDOG_LEVEL || '3', 10); // Default to WARNING (3)
const logToFile = process.env.LOG_TO_FILE === 'true';
let webhookClient: WebhookClient | null = null;

if (process.env.WATCHDOG_WEBHOOK) {
    webhookClient = new WebhookClient({ url: process.env.WATCHDOG_WEBHOOK });
}

function getLogFilePath(): string {
    if (!fs.existsSync('./log')) {
        fs.mkdirSync('./log');
    }
    const date = new Date().toISOString().split('T')[0];
    return path.resolve('./log', `${date}.log`);
}

function formatLogMessage(level: string, message: string | Error): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message.toString()}`;
}

function writeToLogFile(logMessage: string): void {
    if (!logToFile) return;
    const logFilePath = getLogFilePath();
    fs.appendFileSync(logFilePath, `${logMessage}\n`, 'utf8');
}

function log(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('INFO', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.INFO) {
            console.log(`\x1b[32m${logMessage}\x1b[0m`);
        }
    });
}

function debug(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('DEBUG', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.log(`\x1b[33m${logMessage}\x1b[0m`);
        }
    });
}

function trace(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('TRACE', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.TRACE) {
            console.log(`\x1b[36m${logMessage}\x1b[0m`);
        }
    });
}

function error(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('ERROR', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.ERROR) {
            console.log(`\x1b[31m${logMessage}\x1b[0m`);
        }
    });
}

function warning(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('WARNING', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.WARNING) {
            console.log(`\x1b[33m${logMessage}\x1b[0m`);
        }
    });
}

function fatal(...messages: string[] | Error[]): void {
    messages.forEach((message) => {
        const logMessage = formatLogMessage('FATAL', message);
        writeToLogFile(logMessage);
        if (currentLogLevel >= LOG_LEVELS.FATAL) {
            console.log(`\x1b[31m${logMessage}\x1b[0m`);
        }
    });
}

function watchdog(logLevel: number, ...messages: string[] | Error[]): void {
    if (logLevel < watchDogLevel) return;
    messages.forEach((message) => {
        if (!webhookClient || webhookClient === null) return;
        webhookClient.send(message.toString()).catch((err) => {
            webhookClient = null;
            error(`Encountered an unexpected error attempting to use watchdog, disabling watchdog monitoring.`, err.stack);
        });
    });
}

class Logger {
    public static log(...messages: string[] | Error[]): void {
        log(...messages);
        watchdog(LOG_LEVELS.INFO, ...messages);
    }

    public static info(...messages: string[] | Error[]): void {
        log(...messages);
        watchdog(LOG_LEVELS.INFO, ...messages);
    }

    public static debug(...messages: string[] | Error[]): void {
        debug(...messages);
        watchdog(LOG_LEVELS.DEBUG, ...messages);
    }

    public static trace(...messages: string[] | Error[]): void {
        trace(...messages);
        watchdog(LOG_LEVELS.TRACE, ...messages);
    }

    public static error(...messages: string[] | Error[]): void {
        error(...messages);
        watchdog(LOG_LEVELS.ERROR, ...messages);
    }

    public static warning(...messages: string[] | Error[]): void {
        warning(...messages);
        watchdog(LOG_LEVELS.WARNING, ...messages);
    }

    public static fatal(...messages: string[] | Error[]): void {
        fatal(...messages);
        watchdog(LOG_LEVELS.FATAL, ...messages);
    }
}

export { Logger, log, debug, trace, error, warning, fatal };
