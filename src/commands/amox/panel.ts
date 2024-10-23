import GargoyleButtonBuilder from '@src/system/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@src/system/builders/gargoyleModalBuilder.js';
import { GargoyleChannelSelectMenuBuilder, GargoyleStringSelectMenuBuilder } from '@src/system/builders/gargoyleSelectMenuBuilders.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    ModalSubmitInteraction,
    PrivateThreadChannel,
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

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        // Only used when the panel is being created
        if (args[0] === 'panelcreate') {
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
        // Called whenever a user has interacted with a category on the panel
        // And then allows the user to select a sub-category
        if (args[0] === 'category') {
            await interaction.deferReply({ ephemeral: true });
            const category = interaction.values[0];
            const channel = interaction.guild?.channels.cache.get(category);

            if (!channel) return;

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

            await interaction.message.edit({ components: [...interaction.message.components] }); // Workaround to set the selection menu to nothing selected again
        }
        // Called whenever a user has interacted with a sub-category on the panel
        // And then allows the user to create a commission
        if (args[0] === 'subcategory') {
            const subCategory = interaction.values[0];
            const channel = interaction.guild?.channels.cache.get(subCategory);

            if (!channel) return;

            const modal = new GargoyleModalBuilder(this, 'createcommission', channel.id).setTitle('Create a new commission');
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
            await interaction.deleteReply(); // Deletes the ephemeral reply to keep things clean for users
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'createcommission') {
            await interaction.deferReply({ ephemeral: true });
            const service = interaction.fields.getField('service')?.value;
            const description = interaction.fields.getField('description')?.value;
            const requirements = interaction.fields.getField('requirements')?.value || 'None';
            const budget = interaction.fields.getField('budget')?.value;
            client.logger.info(interaction.customId);

            const channel = await interaction.channel?.fetch();
            if (!(channel instanceof TextChannel)) {
                return client.logger.error('Channel is not a TextChannel');
            }

            const subCategory = await interaction.guild?.channels.fetch(args[1]);
            if (!subCategory) return;
            const parentId = subCategory.parentId;
            if (!parentId) return;
            const category = await interaction.guild?.channels.fetch(parentId);
            if (!category) return;

            const thread = (await channel.threads
                .create({
                    name: `${category.name}/${subCategory.name} - ${interaction.user.displayName}`,
                    autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
                    type: ChannelType.PrivateThread,
                    invitable: true
                })
                .catch((error) => {
                    client.logger.error(error as Error);
                    return interaction.editReply({ content: 'An error occurred while creating the thread.' });
                })) as PrivateThreadChannel;

            if (!thread) return;

            // Create the user's commission thread with the information provided
            await thread
                .send(`**Service:** ${service}\n**Description:** ${description}\n**Requirements:** ${requirements}\n**Budget:** ${budget}`)
                .then((msg) => {
                    msg.pin();
                });
            thread.members.add(interaction.user.id);

            // Create the commission request in the sub-category channel
            (subCategory as TextChannel).send({
                content: `A new commission request has been created by ${interaction.user}!`,
                embeds: [
                    new GargoyleEmbedBuilder()
                        .setTitle('New Commission Request')
                        .setDescription(
                            `**Service:** ${service}\n**Description:** ${description}\n**Requirements:** ${requirements}\n**Budget:** ${budget}`
                        )
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this, 'acceptcom', thread.id, interaction.user.id).setStyle(ButtonStyle.Success).setLabel('Accept'),
                        new GargoyleButtonBuilder(this, 'negotiatecom', thread.id, interaction.user.id)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Negotiate')
                    )
                ]
            });

            // Edit the original message to let the user know the commission has been created
            await interaction.editReply({ content: `The commission has been created, you can view it here ${thread}!` });
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'acceptcom') {
            // Accept the commission button
            const thread = interaction.guild?.channels.cache.get(args[1]);
            if (!thread) {
                await interaction.update({ components: [] });
                interaction.followUp({
                    content: 'This commission no longer exists!',
                    ephemeral: true
                });
                return;
            }
            const user = interaction.user;
            if (!user) return;

            (thread as PrivateThreadChannel).send({
                content: `${user} is willing to accept your commission!\n### If you accept it means that the money is now "locked in" so to say, the developer will start work, and only if agreed upon by both parties and according to the TOS will the money be fully refunded.\n-# Note, when accepting the developer no other developers can accept it anymore.`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this, 'acceptdev', interaction.channelId, interaction.message.id) // Accept the developer button
                            .setStyle(ButtonStyle.Success)
                            .setLabel('Accept'),
                        new GargoyleButtonBuilder(this, 'denydev', interaction.channelId, interaction.message.id) // Deny the developer button
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('Deny')
                    )
                ]
            });

            interaction.reply({ content: 'You have accepted the commission, wait for the commission owner to agree.', ephemeral: true });
        }
        if (args[0] === 'negotiatecom') {
            // Negotiate the commission button
            const thread = interaction.guild?.channels.cache.get(args[1]);
            if (!thread) {
                await interaction.update({ components: [] });
                interaction.followUp({
                    content: 'This commission no longer exists!',
                    ephemeral: true
                });
                return;
            }
            const user = interaction.user;
            if (!user) return;

            (thread as PrivateThreadChannel).send({
                content: `${user} is willing to negotiate the commission!`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this, 'acceptnegdev', interaction.channelId, interaction.message.id) // Accept the developer button
                            .setStyle(ButtonStyle.Success)
                            .setLabel('Accept'),
                        new GargoyleButtonBuilder(this, 'denynegdev', interaction.channelId, interaction.message.id) // Deny the developer button
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('Deny')
                    )
                ]
            });
        }
    }
}
