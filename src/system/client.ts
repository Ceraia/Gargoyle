import { container, SapphireClient, SapphireClientOptions } from "@sapphire/framework";
import { ClientOptions, Message } from "discord.js";
import Database from "./database/database.js";

class GargoyleClient extends SapphireClient {
	constructor(options: ClientOptions & SapphireClientOptions) {
		super(options);
		
	}
	public override login(token?: string) {
		container.database = new Database(this);
		return super.login(token || process.env.BOT_TOKEN);
	}

	public override destroy() {
		container.database.close();
		return super.destroy();
	}

	public override fetchPrefix = async (message: Message) => {
		const guild = await container.database.getGuild(message.guildId!);
		return guild.prefix;
	}
}

declare module "@sapphire/pieces" { 
	interface Container {
		database: Database;
	}
}

export default GargoyleClient;
