import { Client, ClientOptions, Collection } from 'discord.js';
import Database from '@database/database.js';
import { Logger } from '../tools/logger.js';
import registerEvents from '../initializers/registerEvents.js';
import GargoyleCommand from './commandClass.js';

class GargoyleClient extends Client {
    db: Database | null;
    commands: Collection<string, GargoyleCommand>;

    constructor(options: ClientOptions) {
        super(options);
        this.db = new Database(this);
        this.commands = new Collection();
        this.loadSystemEvents();
        this.loadEvents();
    }

    public logger = Logger;

    public async loadSystemEvents() {
        this.logger.log('Loading system events...');
        await registerEvents(this, '../../system/events');
    }

    public async loadEvents() {
        this.logger.log('Loading events...');
        await registerEvents(this, '../../events');
    }

    override async login(token?: string) {
        if (this.db?.willConnect) this.logger.log('Waiting for database connection...');
        try {
            await this.db?.isConnected();
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
