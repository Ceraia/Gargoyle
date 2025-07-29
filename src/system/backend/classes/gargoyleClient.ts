import { Client, ClientOptions } from 'discord.js';
import Database from '@src/system/backend/database/database.js';
import { Logger } from '../tools/logger.js';
import registerEvents from '../initializers/registerEvents.js';
import GargoyleCommand from './gargoyleCommand.js';
import loadCommands from '../initializers/loadCommands.js';
import executeWebRequest from '../tools/web.js';
/**
 * Represents a client for the Gargoyle system, extending the base Client class.
 * Handles database connection, command loading, and event registration.
 *
 * @extends Client
 */
class GargoyleClient extends Client {
    /**
     * The start time of the client.
     * @type {number}
     */
    startTime: Date;

    /**
     * The database instance associated with the client.
     * @type {Database | null}
     */
    db: Database | null = null;
    /**
     * The command prefix for the client.
     * @type {string}
     */
    prefix: string;
    /**
     * The list of commands registered with the client.
     * @type {Array<GargoyleCommand>}
     */
    commands: Array<GargoyleCommand>;

    /**
     * Creates an instance of GargoyleClient.
     * Initializes the database, prefix, and commands.
     *
     * @param {ClientOptions} options - The options for the client.
     */
    constructor(options: ClientOptions) {
        super(options);
        this.startTime = new Date();
        this.prefix = process.env.PREFIX ?? ',';
        this.commands = [];
    }

    /**
     * The logger instance used for logging messages.
     * @type {Logger}
     */
    public logger = Logger;

    /**
     * Loads system events from the specified directory.
     * Logs the progress of loading system events.
     *
     * @returns {Promise<void>}
     */
    public async loadSystemEvents() {
        this.logger.log('Loading system events...');
        await registerEvents(this, '../events');
    }

    /**
     * Loads events from the specified directory.
     * Logs the progress of loading events.
     *
     * @returns {Promise<void>}
     */
    public async loadEvents() {
        this.logger.log('Loading events...');
        await registerEvents(this, '../../../events');
    }

    /**
     * Loads commands from the specified directories.
     * Logs the progress of loading commands and the total number of commands loaded.
     *
     * @returns {Promise<void>}
     */
    public async loadCommands() {
        this.logger.log('Loading system commands...');
        await loadCommands(this, '../../commands');
        this.logger.log('Loading commands...');
        await loadCommands(this, '../../../commands');
        this.logger.log(`Loaded ${this.commands.length} commands!`);
    }

    /**
     * Logs in the client to Discord.
     * Waits for the database connection and loads system events, events, and commands before logging in.
     * Handles database connection failures gracefully.
     *
     * @param {string} [token] - The token to log in with. If not provided, uses the token from the environment variables.
     * @returns {Promise<string>}
     */
    override async login(token?: string): Promise<string> {
        this.startHealthCheckServer();
        this.startApiServer();

        this.db = new Database(this);

        this.logger.debug('Awaiting promises for system events and events...');
        await Promise.all([
            this.loadSystemEvents(), // comment for autoformat
            this.loadEvents(), // -
            this.loadCommands()
        ]);
        this.logger.debug('Promises resolved...');

        const loginResult = await super.login(token ?? process.env.DISCORD_TOKEN).catch((err) => {
            this.logger.error(err, 'Error logging in');
            process.exit(0);
        });

        await this.db?.connect();

        if (!this.db?.willConnect) {
            this.db = null;
            this.logger.warning("Database connection won't be established, setting db to null");
        }

        return loginResult;
    }

    /**
     * Health check server for the bot.
     * Responds with 'OK' if the client is ready.
     * Responds with 'Not Found' otherwise.
     */
    private startHealthCheckServer() {
        Bun.serve({
            port: 3000,
            fetch: (req) => {
                if (new URL(req.url).pathname === '/health' && this.isReady() && this.ws.status === 0) {
                    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
                } else {
                    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
                }
            }
        });
        this.logger.log('Health check server is running on port 3000');
    }

    /**
     * Starts the API server for handling web requests.
     * Listens on port 3001 and executes commands based on the request URL.
     */
    private startApiServer() {
        Bun.serve({
            port: 3001,
            fetch: (req) => {
                return executeWebRequest(this, req);
            }
        });
        this.logger.log('API server is running on port 3001');
    }
}

export default GargoyleClient;
