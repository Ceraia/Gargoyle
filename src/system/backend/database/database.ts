import mongoose from 'mongoose';
import { databaseGuilds, getGuild } from '@src/system/backend/database/models/databaseGuildSchema.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import { databaseGuildUsers, getGuildUser } from '@src/system/backend/database/models/databaseGuildUserSchema.js';

class Database extends mongoose.Connection {
    public willConnect: boolean = true;
    private client: GargoyleClient;

    constructor(client: GargoyleClient) {
        super();
        this.client = client;

        const uri = process.env.MONGO_URI;
        if (!uri) {
            this.client.logger.warning('No MongoDB URI provided', 'No database connection will be established');
            this.willConnect = false;
            this.client.db = null;
        }
    }

    public async connect(): Promise<void> {
        this.client.logger.log('Connecting to the database...');

        const uri = process.env.MONGO_URI;
        if (!uri) {
            this.client.logger.warning('No MongoDB URI provided', 'No database connection will be established');
            this.willConnect = false;
            this.client.db = null;
            return;
        }

        await mongoose
            .connect(uri.replace('&CLIENT_ID', this.client.user?.id ?? 'gargoyle'))
            .then(() => {
                this.client.logger.log('Connected to the database');
                this.client.db = this;
            })
            .catch((err) => {
                this.client.logger.error(err, 'Error connecting to the database: No database connection will be established');
                this.willConnect = false;
                this.client.db = null;
            });

    }

    public databaseGuilds = databaseGuilds;
    public getGuild = getGuild;
    public databaseGuildUsers = databaseGuildUsers;
    public getGuildUser = getGuildUser;
}

export default Database;
