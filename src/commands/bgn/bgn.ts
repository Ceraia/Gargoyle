import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import {
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    GuildTextChannelType,
    MessageCreateOptions,
    MessageFlags,
    PermissionFlagsBits,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';
import GargoyleButtonBuilder, { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';

export default class Brads extends GargoyleCommand {
    public override category: string = 'bgn';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('bgn')
            .setDescription("A command for Brad's RP")
            .addGuild('324195889977622530')
            .addSubcommand((subcommand) => subcommand.setName('panel').setDescription('Send the BGN panel')) as GargoyleSlashCommandBuilder
    ];
    private panelMessage = {
        components: [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# Staff, Support & Appeals' +
                            '\n> Click the buttons below to get support, be it to report an issue, apply for staff or appeal a ban, if you just have a question feel free to open a ticket.'
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 📩 Support Ticket\n> Support with purchases, reports or other general inqueries')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'support').setLabel('Support').setStyle(ButtonStyle.Secondary).setEmoji('📩')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '# 👮 Faction Support\n> Report a faction member or ask questions about a faction (for in-game factions, Smugglers, Police, Hitman)'
                            )
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'faction').setLabel('Factions').setStyle(ButtonStyle.Secondary).setEmoji('👮')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 📦 Staff Matters\n> Applications, reports & questions relating to staff.')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'staff').setLabel('Staff Matters').setStyle(ButtonStyle.Secondary).setEmoji('📦')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 🔨 Ban Appeals\n> For if you want to appeal or question an in-game ban.')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'ban').setLabel('Ban Appeals').setStyle(ButtonStyle.Secondary).setEmoji('🔨')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent("# 🛒 Store\n> For if you want to donate to Brad's Network"))
                        .setButtonAccessory(
                            new GargoyleURLButtonBuilder('https://store.bradsnetwork.com/')
                                .setLabel('Donate')
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('🛒')
                        )
                )
        ],
        flags: [MessageFlags.IsComponentsV2]
    } as MessageCreateOptions;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'panel') {
            if (!interaction.channel) {
                interaction.reply('You can only use this interaction in channels.');
                return;
            }
            const channel = await client.channels.fetch(interaction.channel.id);

            if (!channel) {
                interaction.reply('I cannot find the channel to send this to');
                return;
            }

            (channel as TextChannel).send(this.panelMessage).catch((err) => client.logger.error(err.stack));
        }
    }
}

async function isTicketChannel(client: GargoyleClient, channelInput: TextChannel): Promise<boolean> {
    if (!client.user) return false;
    const channel = (await client.channels.fetch(channelInput.id)) as TextChannel;
    if (
        channel.permissionOverwrites.resolve(client.user) &&
        channel.permissionOverwrites.resolve(client.user)?.allow.has(PermissionFlagsBits.SendTTSMessages) &&
        channel.permissionOverwrites.resolve(client.user)?.allow.has(PermissionFlagsBits.SendVoiceMessages)
    ) {
        return true;
    }
    return false;
}

async function makeTicketChannel(client: GargoyleClient, category: string, member: GuildMember): Promise<TextChannel | null>{
    try {
        const parent = (await member.guild.channels.fetch(category))

        if(!parent) return null;

        return await member.guild.channels.create({
            name: `${parent.name}-${member.displayName}`,
            type: ChannelType.GuildText,
            parent: parent.id,
            permissionOverwrites: [{id: member.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel]}]
        })
    } catch (err) {
        return null;
    }
}