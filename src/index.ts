import { client } from "@src/system/botClient.js";

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
