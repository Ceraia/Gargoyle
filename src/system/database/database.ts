import mongoose from "mongoose";
import { databaseGuilds, getGuild } from "@src/system/database/models/databaseGuildSchema.js";
import GargoyleClient from "@src/system/classes/clientClass.js";
import { databaseGuildUsers, getGuildUser } from "@src/system/database/models/databaseGuildUserSchema.js";

class Database extends mongoose.Connection {
	constructor(gargoyleClient: GargoyleClient) {
		super();
		const uri = process.env.MONGO_URI;
		if (!uri) {
			throw new Error("MONGO_URI is not defined");
		}
		mongoose
			.connect(uri)
			.then(() => {
				gargoyleClient.log("Connected to the database");
			})
			.catch((err) => {
				gargoyleClient.log(err);
			});
	}
	public databaseGuilds = databaseGuilds;
	public getGuild = getGuild;
	public databaseGuildUsers = databaseGuildUsers;
	public getGuildUser = getGuildUser;
}

export default Database;
