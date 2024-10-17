import { Client, ClientOptions } from 'discord.js';
import Database from '@database/database.js';
import { Logger } from '../tools/logger.js';
import registerEvents from '../initializers/registerEvents.js';
import GargoyleCommand from './gargoyleCommand.js';
import loadCommands from '../initializers/loadCommands.js';
class GargoyleClient extends Client {
    db: Database | null;
    prefix: string;
    commands: Array<GargoyleCommand>;

    constructor(options: ClientOptions) {
        super(options);
        this.db = new Database(this);
        this.prefix = process.env.PREFIX ?? ',';
        this.commands = [];
    }

    public logger = Logger;

    public async loadSystemEvents() {
        this.logger.log('Loading system events...');
        await registerEvents(this, '../../system/events');
        this.logger.log('System events loaded!');
    }

    public async loadEvents() {
        this.logger.log('Loading events...');
        await registerEvents(this, '../../events');
        this.logger.log('Events loaded!');
    }

    public async loadCommands() {
        this.logger.log('Loading system commands...');
        await loadCommands(this, '../commands');
        this.logger.log('Loading commands...');
        await loadCommands(this, '../../commands');
        this.logger.log(`Loaded ${this.commands.length} commands!`);
    }

    override async login(token?: string) {
        if (this.db?.willConnect) this.logger.log('Waiting for database connection...');

        this.logger.trace('Awaiting promises for system events and events...');
        await Promise.all([
            this.loadSystemEvents(), // comment for autoformat
            this.loadEvents(), // -
            this.loadCommands()
        ]);
        this.logger.trace('Promises resolved...');

        try {
            this.logger.trace('Database connection established!', 'Logging in');
            return super.login(token ?? process.env.DISCORD_TOKEN);
        } catch {
            this.logger.debug('Database connection failed, setting db to null');
            this.db = null;
            this.logger.trace('Logging in without database connection...');
            return super.login(token ?? process.env.DISCORD_TOKEN);
        }
    }
}

export default GargoyleClient;
