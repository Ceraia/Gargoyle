import client from '@src/system/botClient.js';

const main = async () => {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        client.logger.log('Logged in!');
    } catch (error) {
        client.logger.error(error as string);
        await client.destroy();
        process.exit(1);
    }
};

void main();
