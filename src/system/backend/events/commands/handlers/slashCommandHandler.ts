import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ChatInputCommandInteraction } from 'discord.js';

export default class SlashCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public execute(client: GargoyleClient, interaction: ChatInputCommandInteraction): void {
        if (!interaction.isCommand()) return;
        if (interaction.user.bot) return;
        if (!interaction.isChatInputCommand()) return;
        if (interaction.isContextMenuCommand()) return;

        const command = client.commands.find((command) => {
            return command.slashCommand?.name === interaction.commandName;
        });

        if (!command) {
            interaction.reply('Command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });

            if (interaction.guild?.commands.cache.has(interaction.commandName)) {
                client.logger.warning(`Command not found: ${interaction.commandName}`);
                interaction.guild.commands.cache.get(interaction.commandName)?.delete();
            }
        } else {
            command.executeSlashCommand(client, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.commandName} command.`);
        }
    }
}
