import mongoose from "mongoose";
import { databaseGuilds, getGuild } from "./models/databaseGuildSchema.js";
import GargoyleClient from "../client.js";

class Database extends mongoose.Connection {
	constructor(gargoyleClient: GargoyleClient, mongoUri?: string) {
		super();
		const uri = process.env.MONGO_URI || mongoUri;
		if (!uri) {
			throw new Error("MONGO_URI is not defined");
		}
		mongoose.connect(uri).then(() => {
			gargoyleClient.logger.info("Connected to the database");
		});
	}
	public databaseGuilds = databaseGuilds;
	public getGuild = getGuild;
}

export default Database;
