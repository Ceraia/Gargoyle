import { Client, ClientOptions, Collection } from 'discord.js';
// import Database from '@database/database.js';
import { debug, error, log, warning } from '../tools/logger.js';
import registerEvents from '../initializers/registerEvents.js';
import GargoyleCommand from './commandClass.js';

class GargoyleClient extends Client {
    // db: Database;
    commands: Collection<string, GargoyleCommand>;

    constructor(options: ClientOptions) {
        super(options);
        // this.db = new Database(this);
        this.commands = new Collection();
        this.loadEvents();
    }

    public log(message: string) {
        log(message);
    }

    public debug(message: string) {
        debug(message);
    }

    public error(message: string) {
        error(message);
    }

    public warning(message: string) {
        warning(message);
    }

    public async loadEvents() {
        this.log('Loading events...');
        await registerEvents(this, '../../events');
    }

    override login(token?: string) {
        this.log('Logging in...');
        return super.login(token ?? process.env.DISCORD_TOKEN);
    }
}

export default GargoyleClient;