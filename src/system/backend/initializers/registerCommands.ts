import GargoyleClient from '../classes/gargoyleClient.js';

async function registerCommands(client: GargoyleClient): Promise<void> {
    await client.application?.commands.fetch().then((commands) => {
        commands.forEach(async (command) => {
            if (!client.commands.find((c) => c.slashCommand?.name === command.name)) {
                client.logger.debug(`Deleting command: ${command.name}`);
                await client.application?.commands.delete(command);
            }
        });
    });

    client.commands.forEach(async (command) => {
        if (command.slashCommand) {
            client.logger.debug(`Registering slash command: ${command.slashCommand.name}`);
            if (!command.guild) {
                await client.application?.commands.create(command.slashCommand);
            } else {
                await client.guilds.cache
                    .get(command.guild)
                    ?.commands.create(command.slashCommand)
                    .catch(() => {
                        client.logger.error(`Failed to register slash command: ${command.slashCommand?.name} in guild: ${command.guild}`);
                    });
            }
        }
    });
}

export default registerCommands;
