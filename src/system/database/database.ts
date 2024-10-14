import mongoose from 'mongoose';
import { databaseGuilds, getGuild } from '@src/system/database/models/databaseGuildSchema.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import { databaseGuildUsers, getGuildUser } from '@src/system/database/models/databaseGuildUserSchema.js';

class Database extends mongoose.Connection {
    constructor(client: GargoyleClient) {
        client.logger.log('Connecting to the database');
        super();
        const uri = process.env.MONGO_URI;
        if (!uri) {
            client.logger.error('No MongoDB URI provided');
            process.exit(1);
        }

        mongoose
            .connect(uri)
            .then(() => {
                client.logger.log('Connected to the database');
            })
            .catch((err) => {
                client.logger.error(err);
            });
    }
    public databaseGuilds = databaseGuilds;
    public getGuild = getGuild;
    public databaseGuildUsers = databaseGuildUsers;
    public getGuildUser = getGuildUser;
}

export default Database;
