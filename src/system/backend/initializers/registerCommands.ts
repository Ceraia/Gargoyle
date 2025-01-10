import GargoyleClient from '../classes/gargoyleClient.js';

async function registerCommands(client: GargoyleClient): Promise<void> {
    await client.application?.commands.fetch().then((commands) => {
        commands.forEach(async (command) => {
            // Find if a command with the same name exists
            const existingCommand = client.commands.find(
                (cmd) =>
                    cmd.slashCommand?.name === command.name || cmd.contextCommands?.find((contextCommand) => contextCommand.name === command.name)
            );
            if (!existingCommand || !existingCommand.slashCommand || existingCommand.slashCommand.guilds) {
                client.logger.debug(`Deleting unknown slash command: ${command.name}`);
                await command.delete();
            }
        });
    });

    client.commands.forEach(async (command) => {
        if (command.slashCommand) {
            client.logger.trace(`Command has slash command: ${command.slashCommand.name}`);
            if (command.slashCommand.guilds.length <= 0) {
                client.logger.debug(`Registering slash command: ${command.slashCommand.name}`);
                await client.application?.commands.create(command.slashCommand);
            } else {
                client.logger.trace(`Slashcommand has guilds: ${command.slashCommand.guilds.join(',')}`);

                command.slashCommand.guilds.forEach((guildId) => {
                    if (command.slashCommand === null) return client.logger.error('Slash command has guilds defined but no slash command.');
                    const guild = client.guilds.cache.get(guildId);
                    if (!guild) return client.logger.warning(`Cannot find guild ${guildId}`);

                    guild.commands
                        .create(command.slashCommand)
                        .catch(() => {
                            client.logger.error(`Failed to register slash command ${command.slashCommand?.name} in ${guildId}`);
                        })
                        .then(() => {
                            client.logger.debug(`Registered slashcommand ${command.slashCommand?.name} in guild ${guild.name}`);
                        });
                });
            }
        }
        if (command.contextCommands) {
            command.contextCommands.forEach(async (contextCommand) => {
                if (!command.guild) {
                    client.logger.debug(`Registering context command: ${contextCommand.name}`);
                    await client.application?.commands.create(contextCommand);
                } else {
                    client.logger.debug(`Registering context command: ${contextCommand.name} in guild: ${command.guild}`);
                    await client.guilds.cache
                        .get(command.guild)
                        ?.commands.create(contextCommand)
                        .catch(() => {
                            client.logger.error(`Failed to register context command: ${contextCommand.name} in guild: ${command.guild}`);
                        });
                }
            });
        }
    });
}

export default registerCommands;
