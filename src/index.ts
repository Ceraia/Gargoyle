import { Client, ClientOptions, GatewayIntentBits, Partials } from "discord.js";

class GargoyleClient extends Client {
	constructor(options: ClientOptions) {
		super(options);
	}
	public testExistance() {
		console.log(`${Date.now()}`);
	}
}

const client = new GargoyleClient({
	shards: "auto",
	intents: [
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});

client.once("ready", () => {
	console.info("Ready");
	client.testExistance();
});

const main = async () => {
	try {
		console.info("Logging in");
		await client.login();
		console.info("Logged in");
	} catch (error) {
		console.error(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
