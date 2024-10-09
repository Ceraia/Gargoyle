import "./system/lib/setup.js";

import { GatewayIntentBits, Partials } from "discord.js";
import GargoyleClient from "./system/client.js";

const client = new GargoyleClient({
	defaultPrefix: ",",
	regexPrefix: /^(hey +)?ceraia[,! ]/i,
	caseInsensitiveCommands: true,
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
	loadMessageCommandListeners: true,
});

const main = async () => {
	try {
		client.logger.info("Logging in");
		await client.login();
		client.logger.info("Logged in");
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
