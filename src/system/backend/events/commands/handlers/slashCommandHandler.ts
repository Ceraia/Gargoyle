import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ChatInputCommandInteraction } from 'discord.js';

export default class SlashCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public async execute(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;
        if (interaction.user.bot) return;
        if (!interaction.isChatInputCommand()) return;
        if (interaction.isContextMenuCommand()) return;

        const command = client.commands.find((command) => {
            return (
                command.slashCommand?.name === interaction.commandName ||
                command.slashCommands.find((slashcommand) => {
                    return slashcommand.name === interaction.commandName;
                })
            );
        });

        if (!command) {
            interaction.reply('Command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });

            client.logger.warning(`Command not found: ${interaction.commandName}, deleting command.`);
            try {
                if (interaction.guild) {
                    const discordCommand = await interaction.guild.commands.fetch(interaction.commandId).catch(() => {
                        return null;
                    });
                    if (discordCommand) {
                        await discordCommand.delete();
                        client.logger.warning(`Command not found: ${interaction.commandName}, deleted!`);
                    } else {
                        client.logger.warning(`Command not found: ${interaction.commandName}, not found in guild either!`);
                    }
                } else {
                    client.logger.debug(`Command not found: ${interaction.commandName}, not in guild.`);
                    await interaction.command?.delete();
                }
            } catch (err) {
                client.logger.error(`Failed to delete command ${interaction.commandName}: ${err}`);
            }
            return;
        } else {
            command.executeSlashCommand(client, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.commandName} command.`);
        }
    }
}
