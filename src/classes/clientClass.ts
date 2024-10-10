import { Client, ClientOptions } from "discord.js";

class GargoyleClient extends Client {
	constructor(options: ClientOptions) {
		super(options);
	}
	public testExistance() {
		console.log(`${Date.now()}`);
	}
	public log(message: string) {
		console.log(message);
	}
}

export default GargoyleClient;
