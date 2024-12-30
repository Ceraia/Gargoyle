import { Client, ClientOptions } from 'discord.js';
import Database from '@src/system/backend/database/database.js';
import { Logger } from '../tools/logger.js';
import registerEvents from '../initializers/registerEvents.js';
import GargoyleCommand from './gargoyleCommand.js';
import loadCommands from '../initializers/loadCommands.js';

/**
 * Represents a client for the Gargoyle system, extending the base Client class.
 * Handles database connection, command loading, and event registration.
 *
 * @extends Client
 */
class GargoyleClient extends Client {
    /**
     * The database instance associated with the client.
     * @type {Database | null}
     */
    db: Database | null;
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
        this.db = new Database(this);
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
    override async login(token?: string) {
        if (this.db?.willConnect) this.logger.log('Waiting for database connection...');

        this.logger.debug('Awaiting promises for system events and events...');
        await Promise.all([
            this.loadSystemEvents(), // comment for autoformat
            this.loadEvents(), // -
            this.loadCommands()
        ]);
        this.logger.debug('Promises resolved...');

        try {
            this.logger.debug('Database connection established!', 'Logging in');
            return super.login(token ?? process.env.DISCORD_TOKEN);
        } catch {
            this.logger.debug('Database connection failed, setting db to null');
            this.db = null;
            this.logger.debug('Logging in without database connection...');
            return super.login(token ?? process.env.DISCORD_TOKEN);
        }
    }
}

export default GargoyleClient;
