import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
export default class Help extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder().setName('utilities').setDescription('Replies with bot information');
    public override textCommand = null;

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {

    }

    public override async executeButtonCommand(client: GargoyleClient, argument: string, interaction: ButtonInteraction): Promise<void> {
        if (argument === 'commands') {
            const message = await this.generateSlashHelpMessage(client);
            await interaction.update(message);
        }
    }

    private async generateSlashHelpMessage(client: GargoyleClient): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Slash Commands');
        await client.commands.forEach(command => {
            if(command.slashCommand) embed.addFields({ name: command.slashCommand?.name, value: command.slashCommand?.description });
        });

        return {
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'commands').setStyle(ButtonStyle.Primary).setLabel('Slash Commands'),
                    new GargoyleButtonBuilder(this, 'text').setStyle(ButtonStyle.Secondary).setLabel('Text Commands')
                )]
        };
    }

    private async generateTextHelpMessage(client: GargoyleClient): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Text Commands');
        await client.commands.forEach(command => {
            if (command.textCommand) {
                let name = command.textCommand.name;
                if (command.textCommand?.aliases) {
                    name += `(${command.textCommand.aliases.join(', ')})`;
                }
                embed.addFields({ name: name, value: command.textCommand.description });
            }
        });

        return {
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'commands').setStyle(ButtonStyle.Secondary).setLabel('Slash Commands'),
                    new GargoyleButtonBuilder(this, 'text').setStyle(ButtonStyle.Primary).setLabel('Text Commands')
                )
            ]
        };
    }
}
