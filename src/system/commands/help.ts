import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    Guild,
    Message,
    MessageEditOptions,
    MessageFlags,
    MessageReplyOptions,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThumbnailBuilder
} from 'discord.js';
import { GargoyleStringSelectMenuBuilder } from '@builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '../backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleModalBuilder from '../backend/builders/gargoyleModalBuilder.js';
import GargoyleButtonBuilder from '../backend/builders/gargoyleButtonBuilder.js';

export default class Help extends GargoyleCommand {
    override category: string = 'base';
    override slashCommands = [new GargoyleSlashCommandBuilder().setName('help').setDescription('Replies with bot information')];
    override textCommands = [new GargoyleTextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h')];
    private readonly selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new GargoyleStringSelectMenuBuilder(this, 'commands').addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Info Message').setValue('info'),
            new StringSelectMenuOptionBuilder().setLabel('Slash Commands').setValue('commands'),
            new StringSelectMenuOptionBuilder().setLabel('Text Commands').setValue('text')
        )
    );
    private readonly helpMessage: MessageEditOptions = {
        content: undefined,
        embeds: [],
        components: [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        'A bot made by [Axodouble](https://axodouble.com).\n' +
                            'Distriobuted, hosted & developed by [Ceraia](https://ceraia.com).' +
                            'This bot is built on Gargoyle, a custom bot framework.\n\n' +
                            'This bot is still in very early development and major changes are expected,\n' +
                            'If you have any suggestions or issues, please contact Axodouble.'
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('Do you want to suggest a feature? You can do so by clicking the `suggest` button!')
                        )
                        .setButtonAccessory(new GargoyleButtonBuilder(this, 'suggest').setLabel('Make a suggestion').setEmoji('✍️'))
                ),
            this.selectMenu
        ],
        flags: [MessageFlags.IsComponentsV2]
    };

    private readonly suggestionModal = new GargoyleModalBuilder(this, 'suggest')
        .setTitle('Suggest a feature')
        .setComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                    .setCustomId('suggestion')
                    .setLabel('Your suggestion')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setPlaceholder('What would you like to suggest?')
                    .setMaxLength(2000)
            )
        );

    override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        interaction.editReply(this.helpMessage);
    }

    override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply(this.helpMessage as MessageReplyOptions);
    }

    override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...argument: string[]): Promise<void> {
        if (argument[0] === 'commands') {
            if (interaction.values[0] === 'commands') {
                const message = await this.generateSlashHelpMessage(client, interaction.guild ? interaction.guild : undefined);
                await interaction.update(message);
            } else if (interaction.values[0] === 'text') {
                const message = await this.generateTextHelpMessage(client, interaction.guild ? interaction.guild : undefined);
                await interaction.update(message);
            } else {
                await interaction.update(this.helpMessage);
            }
        }
    }

    override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...argument: string[]): Promise<void> {
        if (argument[0] === 'commands') {
            const message = await this.generateSlashHelpMessage(client, interaction.guild ? interaction.guild : undefined);
            await interaction.update(message);
        } else if (argument[0] === 'text') {
            const message = await this.generateTextHelpMessage(client, interaction.guild ? interaction.guild : undefined);
            await interaction.update(message);
        } else if (argument[0] === 'suggest') {
            await interaction.showModal(this.suggestionModal);
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'suggest') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const suggestion = interaction.fields.getTextInputValue('suggestion');
            if (suggestion.length < 10) {
                await interaction.editReply({
                    content: 'Your suggestion must be at least 10 characters long.'
                });
                return;
            }

            const suggestionChannel = client.channels.cache.get(process.env.SUGGESTION_CHANNEL_ID!);

            if (!suggestionChannel || suggestionChannel.type !== ChannelType.GuildText) {
                await interaction.editReply({
                    content: 'There was an error sending your suggestion. Please try again later.'
                });
                client.logger.error('Suggestion channel not found or is not text-based.');
                return;
            }

            await suggestionChannel.send({
                components: [
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`New suggestion from ${interaction.user.tag} (${interaction.user.id})`)
                                )
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 128 })))
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(suggestion))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });

            await interaction.editReply({
                content: `Thank you for your suggestion!\nIf we have any questions or need more information, we will contact you.\n\nYour suggestion: ${suggestion}`
            });
        }
    }

    private async generateSlashHelpMessage(client: GargoyleClient, guild?: Guild): Promise<object> {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Slash Commands'));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        let commandText = ``;
        for (const command of client.commands) {
            for (const slashCommand of command.slashCommands) {
                if (slashCommand.private) continue;

                if (slashCommand.guilds.length > 0 && guild) {
                    if (!slashCommand.guilds.includes(guild.id)) continue;
                }
                commandText += `\`/${slashCommand.name}\` \n> ${slashCommand.description}\n\n`;
            }
        }

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(commandText));

        return {
            components: [container, this.selectMenu],
            flags: [MessageFlags.IsComponentsV2]
        };
    }

    private async generateTextHelpMessage(client: GargoyleClient, guild?: Guild): Promise<object> {
        const container = new ContainerBuilder();

        let prefix = client.prefix;
        if (client.db && guild) prefix = (await client.db.getGuild(guild.id)).prefix;

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Text Commands'));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        let commandText = ``;
        for (const command of client.commands) {
            for (const textCommand of command.textCommands) {
                if (textCommand.private) continue;

                if (textCommand.guilds.length > 0 && guild) {
                    if (!textCommand.guilds.includes(guild.id)) continue;
                }
                commandText += `\`${prefix}${textCommand.name}${textCommand.aliases.length > 0 ? ` (${textCommand.aliases.join('|')})` : ``}\`\n> ${textCommand.description}\n\n`;
            }
        }

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(commandText));

        return {
            components: [container, this.selectMenu],
            flags: [MessageFlags.IsComponentsV2]
        };
    }
}
