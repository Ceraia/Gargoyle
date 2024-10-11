import { Client, ClientOptions } from 'discord.js';
import Database from '@database/database.js';
import { debug, error, log, warning } from '../tools/logger.js';
import loadEvents from '../initializers/loadEvents.js';

class GargoyleClient extends Client {
    public db: Database;
    constructor(options: ClientOptions) {
        super(options);
        this.db = new Database(this);

        loadEvents(this);
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

    override login(token?: string) {
        this.log('Logging in...');
        return super.login(token ?? process.env.DISCORD_TOKEN);
    }
}

export default GargoyleClient;