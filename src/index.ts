import client from '@src/system/botClient.js';

const main = async () => {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        client.logger.log('Logged in!');
    } catch (error) {
        client.logger.error(error as string);
        await client.destroy();
        process.exit(0);
        // Exit code 0 suggests a succesful run, however this is not the case here
        // We have this so that environments who run this in docker with the flag --restart=unless-stopped
        // will not keep restarting and cause a potential loop of restarts with incorrect credentials
    }
};

void main();
