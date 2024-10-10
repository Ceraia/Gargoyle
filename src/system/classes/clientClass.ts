import { Client, ClientOptions } from "discord.js";
import Database from "@database/database.js";

class GargoyleClient extends Client {
	public db: Database;
	constructor(options: ClientOptions) {
		super(options);
		this.db = new Database(this);
	}
	public testExistance() {
		console.log(`${Date.now()}`);
	}
	public log(message: string) {
		console.log(message);
	}
}

export default GargoyleClient;
