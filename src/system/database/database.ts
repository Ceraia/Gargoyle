import mongoose from 'mongoose';
import { databaseGuilds, getGuild } from '@dbmodels/databaseGuildSchema.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import { databaseGuildUsers, getGuildUser } from '@dbmodels/databaseGuildUserSchema.js';

class Database extends mongoose.Connection {
    constructor(client: GargoyleClient) {
        client.logger.log('Connecting to the database');
        super();
        const uri = process.env.MONGO_URI;
        if (!uri) {
            client.logger.warning('No MongoDB URI provided', 'No database connection will be established');
            return;
        }

        mongoose
            .connect(uri)
            .then(() => {
                client.logger.log('Connected to the database');
            })
            .catch((err) => {
                client.logger.error(err, 'Error connecting to the database: No database connection will be established');
            });
    }
    public databaseGuilds = databaseGuilds;
    public getGuild = getGuild;
    public databaseGuildUsers = databaseGuildUsers;
    public getGuildUser = getGuildUser;
}

export default Database;
