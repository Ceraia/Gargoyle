import { SapphireClient, SapphireClientOptions } from "@sapphire/framework";
import { ClientOptions } from "discord.js";
import Database from "./database/database.js";

class GargoyleClient extends SapphireClient {
	public database: Database;
	constructor(options: ClientOptions & SapphireClientOptions) {
		super(options);
		this.database = new Database(this);
	}
}

export default GargoyleClient;
