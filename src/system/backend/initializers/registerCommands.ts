import { ContextMenuCommandBuilder } from 'discord.js';
import GargoyleSlashCommandBuilder from '../builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '../classes/gargoyleClient.js';

async function registerCommands(client: GargoyleClient): Promise<void> {
    const slashCommands: GargoyleSlashCommandBuilder[] = [];
    client.commands.forEach((command) => {
        if (command.slashCommand) slashCommands.push(command.slashCommand);

        command.slashCommands.forEach((slashCommand) => {
            slashCommands.push(slashCommand);
        });
    });
    const contextCommands: ContextMenuCommandBuilder[] = [];
    client.commands.forEach((command) => {
        command.contextCommands?.forEach((contextCommand) => {
            contextCommands.push(contextCommand);
        });
    });

    await client.application?.commands.fetch().then((commands) => {
        commands.forEach(async (command) => {
            // Find if a command with the same name exists
            const existingSlashCommand = slashCommands.find((cmd) => cmd.name === command.name);
            const existingContextCommand = contextCommands.find((cmd) => cmd.name === command.name);

            if (
                (!existingSlashCommand && !existingContextCommand) || // If there is no slashcommand or context command with that name
                (existingSlashCommand && existingSlashCommand.guilds && existingSlashCommand.guilds.length > 0)
            ) {
                client.logger.info(`Deleting unknown command: ${command.name}`);
                await command.delete()
            }
        });
    });

    slashCommands.forEach(async (slashCommand) => {
        if (slashCommand.guilds.length <= 0) {
            client.logger.debug(`Registering slash command: ${slashCommand.name}`);
            await client.application?.commands.create(slashCommand);
        } else {
            client.logger.trace(`Slashcommand has guilds: ${slashCommand.guilds.join(',')}`);

            slashCommand.guilds.forEach((guildId) => {
                if (slashCommand === null) return client.logger.error('Slash command has guilds defined but no slash command.');
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return client.logger.warning(`Cannot find guild ${guildId}`);

                guild.commands
                    .create(slashCommand)
                    .catch(() => {
                        client.logger.error(`Failed to register slash command ${slashCommand?.name} in ${guildId}`);
                    })
                    .then(() => {
                        client.logger.debug(`Registered slashcommand ${slashCommand?.name} in guild ${guild.name}`);
                    });
            });
        }
    });

    contextCommands.forEach(async (contextCommand) => {
        client.logger.debug(`Registering context command: ${contextCommand.name}`);
        await client.application?.commands.create(contextCommand);
    });
}

export default registerCommands;
