import GargoyleClient from '../classes/gargoyleClient.js';

async function registerCommands(client: GargoyleClient): Promise<void> {
    await client.application?.commands.fetch().then((commands) => {
        commands.forEach(async (command) => {
            // Find if a command with the same name exists
            const existingCommand = client.commands.find((cmd) => cmd.slashCommand?.name === command.name);
            if (!existingCommand || existingCommand.guild) {
                client.logger.debug(`Deleting unknown slash command: ${command.name}`);
                await command.delete();
            }
        });
    });

    client.commands.forEach(async (command) => {
        if (command.slashCommand) {
            client.logger.trace(`Command has slash command: ${command.slashCommand.name}`);
            if (!command.guild) {
                client.logger.debug(`Registering slash command: ${command.slashCommand.name}`);
                await client.application?.commands.create(command.slashCommand);
            } else {
                client.logger.trace(`Command has guild: ${command.guild}`);
                client.logger.debug(`Registering slash command: ${command.slashCommand.name} in guild: ${command.guild}`);
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
