import GargoyleEmbedBuilder from '@src/system/builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@src/system/builders/gargoyleModalBuilder.js';
import { GargoyleChannelSelectMenuBuilder, GargoyleStringSelectMenuBuilder } from '@src/system/builders/gargoyleSelectMenuBuilders.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ChannelSelectMenuBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    ModalSubmitInteraction,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    ThreadAutoArchiveDuration
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
            const categories = new GargoyleStringSelectMenuBuilder(this, 'category').setMinValues(1).setMaxValues(1);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categories);

            for (const category of interaction.values) {
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
        if (argument === 'category') {
            await interaction.deferReply({ ephemeral: true });
            const category = interaction.values[0];
            const channel = interaction.guild?.channels.cache.get(category);

            const children = interaction.guild?.channels.cache.filter((ch) => ch.parentId === channel?.id && ch.type === ChannelType.GuildText);

            if (!children) return;

            const subCategories = new GargoyleStringSelectMenuBuilder(this, 'subcategory').setMinValues(1).setMaxValues(1);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(subCategories);

            for (const child of children.values()) {
                subCategories.addOptions({
                    label: child.name,
                    value: child.id
                });
            }

            await interaction.editReply({
                embeds: [new GargoyleEmbedBuilder().setTitle('Select what sub-category you want to create a commission for.')],
                components: [row]
            });
        }
        if (argument === 'subcategory') {
            const modal = new GargoyleModalBuilder(this, 'createcommission').setTitle('Create a new commission');
            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setStyle(TextInputStyle.Short)
                        .setLabel('Service')
                        .setPlaceholder('What service are you specifically looking for?')
                        .setCustomId('service')
                        .setRequired(true)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setStyle(TextInputStyle.Paragraph)
                        .setLabel('Description')
                        .setPlaceholder('Describe what you want done, the more details the better.')
                        .setCustomId('description')
                        .setRequired(true)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setStyle(TextInputStyle.Short)
                        .setLabel('Other Requirements')
                        .setPlaceholder('What other requirements do you have? e.g. Must be able to make everything understandable in Spanish')
                        .setCustomId('requirements')
                        .setRequired(false)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setStyle(TextInputStyle.Short)
                        .setLabel('Budget')
                        .setPlaceholder('What is your budget?')
                        .setCustomId('budget')
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
        }
    }

    public override async executeModalCommand(client: GargoyleClient, argument: string, interaction: ModalSubmitInteraction): Promise<void> {
        if (argument === 'createcommission') {
            await interaction.deferReply({ ephemeral: true });
            const service = interaction.fields.getField('service')?.value;
            const description = interaction.fields.getField('description')?.value;
            const requirements = interaction.fields.getField('requirements')?.value;
            const budget = interaction.fields.getField('budget')?.value;
            client.logger.info(interaction.customId);

            const channel = await interaction.channel?.fetch();
            if (!(channel instanceof TextChannel)) {
                return client.logger.error('Channel is not a TextChannel');
            }

            channel.threads
                .create({
                    name: service,
                    autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
                    type: ChannelType.PrivateThread,
                    invitable: true
                })
                .then((thread) => {
                    thread.send(`**Service:** ${service}\n**Description:** ${description}\n**Requirements:** ${requirements}\n**Budget:** ${budget}`);
                    thread.members.add(interaction.user.id);
                });
        }
    }
}
