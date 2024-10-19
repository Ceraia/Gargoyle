import GargoyleEmbedBuilder from '@src/system/builders/gargoyleEmbedBuilder.js';
import { GargoyleChannelSelectMenuBuilder, GargoyleStringSelectMenuBuilder } from '@src/system/builders/gargoyleSelectMenuBuilders.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ChannelSelectMenuBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    TextChannel
} from 'discord.js';

export default class Amox extends GargoyleCommand {
    public override category: string = 'amox';
    public override guild: string = '750209335841390642';
    public override slashCommand = new SlashCommandBuilder()
        .setName('amox')
        .setDescription('All Amox commands')
        .addSubcommandGroup((group) =>
            group
                .setName('panel')
                .setDescription('All Amox panel commands')
                .addSubcommand((subcommand) => subcommand.setName('make').setDescription('Make a new panel'))
        ) as SlashCommandBuilder;

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        // Guild categories would be the main categories
        // Each channel below the category would be a sub-category
        // For example, for all modding commissions and requests
        // The category would be called Modding
        // The sub categories would be games that are officially supported

        // When making the panel the user should be able to select a list of categories

        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new GargoyleChannelSelectMenuBuilder(this, 'panelcreate')
                .setChannelTypes(ChannelType.GuildCategory)
                .setPlaceholder('What main categories should exist for commissions?')
                .setMinValues(1)
                .setMaxValues(25)
        );
        client.logger.debug('Sending the main categories for commissions.');
        if (!interaction.channel) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }
        await interaction.reply({ content: 'Select the main categories for commissions.', components: [row], ephemeral: true });
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, argument: string, interaction: AnySelectMenuInteraction): Promise<void> {
        if (argument === 'panelcreate') {
            await interaction.deferUpdate();
            const categories = new GargoyleStringSelectMenuBuilder(this, 'commission').setMinValues(1).setMaxValues(1);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categories);

            client.logger.info(interaction.values.join(', '));

            for (const category of interaction.values) {
                client.logger.info(category);
                const channel = interaction.guild?.channels.cache.get(category);
                if (!channel) return;
                categories.addOptions({
                    label: channel?.name,
                    value: channel?.id
                });
            }

            await (interaction.channel as TextChannel).send({
                embeds: [new GargoyleEmbedBuilder().setTitle('AMOX Commission Panel')],
                components: [row]
            });
        }
        if (argument === 'commission') {
            await interaction.deferUpdate();
            const category = interaction.values[0];
            const channel = interaction.guild?.channels.cache.get(category);
            if (!channel) return;
            await (interaction.channel as TextChannel).send({
                embeds: [
                    new GargoyleEmbedBuilder().setTitle('AMOX Commission Panel').setDescription(`You have selected ${channel.name} as a category.`)
                ]
            });
        }
    }

    // cmd-amox-argument
}
