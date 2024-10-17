import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import { ButtonInteraction } from 'discord.js';

export default class ButtonCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;
    public once = false;

    public execute(client: GargoyleClient, interaction: ButtonInteraction): void {
        if (!interaction.isButton()) return;
        if (interaction.user.bot) return;

        const command = client.commands.find((command) => {
            return (
                command.slashCommand?.name === interaction.customId.toLowerCase().split('-')[0] ||
                command.textCommand?.name === interaction.customId.toLowerCase().split('-')[0]
            );
        });

        if (!command) {
            interaction.reply('Button not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            const argument = interaction.customId.toLowerCase().split('-')[1];
            command.executeButtonCommand(client, argument, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.customId} button command.`);
        }
    }
}
