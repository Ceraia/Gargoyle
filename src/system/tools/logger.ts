function log(message: string): void {
    console.log(`\x1b[32m[SYSTEM]\x1b[0m ${message}`);
}
function debug(message: string): void {
    if (process.env.DEBUG) console.log(`\x1b[33m[DEBUG]\x1b[0m ${message}`);
}

function error(message: string): void {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
}

function warning(message: string): void {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
}

export { log, debug, error, warning };
