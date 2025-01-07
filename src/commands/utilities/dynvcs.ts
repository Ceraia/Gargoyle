import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import { GargoyleUserSelectMenuBuilder } from '@builders/gargoyleSelectMenuBuilders.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    Events,
    InteractionContextType,
    InteractionReplyOptions,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    MessagePayload,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    VoiceChannel,
    VoiceState
} from 'discord.js';

export default class VoicechatCommand extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voicechat related commands.')
        .setContexts([InteractionContextType.Guild])
        .addSubcommand((subcommand) => subcommand.setName('panel').setDescription('Get the voicechat panel'))
        .addSubcommand((subcommand) =>
            subcommand
                .setName('create')
                .setDescription('Create dynamic vc\'s')
                .addChannelOption((option) =>
                    option
                        .setName('vc')
                        .setRequired(false)
                        .setDescription('The VC that will create the dynamic vcs')
                        .addChannelTypes(ChannelType.GuildVoice)
                )
        ) as SlashCommandBuilder;

    public override textCommand = new TextCommandBuilder()
        .setName('voice')
        .setDescription('Get voicechat interaction panel')
        .addAlias('vc')
        .addAlias('voicechat')
        .setContexts([InteractionContextType.Guild]);

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'panel') {
            interaction.reply(this.panelMessage as InteractionReplyOptions);
        } else if (interaction.options.getSubcommand() === 'create') {
            if (!interaction.guild) return;
            if (!client.user) return;
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
                interaction.reply({ content: 'You need the `MANAGE_CHANNELS` permission to use this command!', flags: MessageFlags.Ephemeral });
            }

            let vc = interaction.options.getChannel('vc');

            if (!vc)
                vc = await interaction.guild.channels.create({
                    name: 'Join to Create',
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            allow: [PermissionFlagsBits.Connect]
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.PrioritySpeaker]
                        }
                    ]
                });
            else
                client.channels.fetch(vc.id).then((channel) => {
                    if (!channel) return;
                    if (!interaction.guild) return;

                    (channel as VoiceChannel).permissionOverwrites.edit(interaction.guild.id, { Connect: true, PrioritySpeaker: true });
                });

            interaction.reply({
                content: `Created the dynamic vc, use \`/vc panel\` or \`${client.prefix}vc\` to get the vc panel!`,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        (message.channel as TextChannel).send(this.panelMessage as MessageCreateOptions);
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] !== 'rename') await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!interaction.guildId || !interaction.user.id) return;
        if (client.user === null) return;

        const vc = (await (await client.guilds.fetch(interaction.guildId)).members.fetch(interaction.user.id)).voice.channel;

        if (!vc) {
            client.logger.trace(`User ${interaction.user.username} tried to use a vc button without being in a vc.`);
            await interaction.editReply({ content: 'You need to be in a voice channel to use this button!' });
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
        ) {
            client.logger.trace(`User ${interaction.user.username} tried to use a vc button without having the correct permissions.`);
            interaction.editReply({ content: 'This is not a dynamic vc!' });
            return;
        }

        switch (args[0]) {
        case 'lock': {
            client.logger.trace(`User ${interaction.user.username} locked/unlocked their vc.`);
            // Lock  / Unlock the vc
            if (
                vc.permissionOverwrites.resolve(interaction.guildId) &&
                    vc.permissionOverwrites.resolve(interaction.guildId)?.deny.has(PermissionFlagsBits.Connect)
            ) {
                if (vc.parent && vc.parent.permissionOverwrites.resolve(interaction.guildId)) {
                    if (vc.parent.permissionOverwrites.resolve(interaction.guildId)?.allow.has(PermissionFlagsBits.Connect)) {
                        vc.permissionOverwrites.edit(interaction.guildId, { Connect: true });
                    } else {
                        vc.permissionOverwrites.edit(interaction.guildId, { Connect: null });
                    }
                } else vc.permissionOverwrites.edit(interaction.guildId, { Connect: null });

                interaction.editReply({ content: 'Unlocked your vc!' });
            } else {
                vc.permissionOverwrites.edit(interaction.guildId, { Connect: false });
                interaction.editReply({ content: 'Locked your vc!' });
            }
            break;
        }
        case 'hide': {
            client.logger.trace(`User ${interaction.user.username} hid/unhid their vc.`);
            // Hide  / Unlock the vc
            if (
                vc.permissionOverwrites.resolve(interaction.guildId) &&
                    vc.permissionOverwrites.resolve(interaction.guildId)?.deny.has(PermissionFlagsBits.ViewChannel)
            ) {
                if (vc.parent && vc.parent.permissionOverwrites.resolve(interaction.guildId)) {
                    if (vc.parent.permissionOverwrites.resolve(interaction.guildId)?.allow.has(PermissionFlagsBits.ViewChannel)) {
                        vc.permissionOverwrites.edit(interaction.guildId, { ViewChannel: true });
                    } else {
                        vc.permissionOverwrites.edit(interaction.guildId, { ViewChannel: null });
                    }
                } else vc.permissionOverwrites.edit(interaction.guildId, { ViewChannel: null });

                interaction.editReply({ content: 'Unhid your vc!' });
            } else {
                vc.permissionOverwrites.edit(interaction.guildId, { ViewChannel: false });
                interaction.editReply({ content: 'Hid your vc!' });
            }
            break;
        }
        case 'increase': {
            client.logger.trace(`User ${interaction.user.username} increased the user limit of their vc.`);
            // Increase the user limit
            vc.edit({ userLimit: vc.userLimit + 1 });
            interaction.editReply({ content: `Increased the user limit to ${vc.userLimit + 1}!` });
            break;
        }
        case 'decrease': {
            client.logger.trace(`User ${interaction.user.username} decreased the user limit of their vc.`);
            // Decrease the user limit

            await vc.edit({ userLimit: vc.userLimit - 1 }).catch(() => {});
            if (vc.userLimit !== 1 && vc.userLimit !== 0) {
                interaction.editReply({ content: `Decreased the user limit to ${vc.userLimit - 1}!` });
            } else if (vc.userLimit === 1) {
                interaction.editReply({ content: 'Disabled the user limit!' });
            } else {
                interaction.editReply({ content: 'The user limit is already at 0!' });
            }
            break;
        }
        case 'ban': {
            client.logger.trace(`User ${interaction.user.username} banned a user from their vc.`);
            // Send a select menu with all the members
            interaction.editReply({
                components: [
                    new ActionRowBuilder<GargoyleUserSelectMenuBuilder>().addComponents(
                        new GargoyleUserSelectMenuBuilder(this, 'ban').setPlaceholder('Select member(s) to ban.').setMaxValues(1).setMinValues(1)
                    )
                ]
            });
            break;
        }
        case 'invite': {
            client.logger.trace(`User ${interaction.user.username} invited a user to their vc.`);
            // Send a select menu with all the members
            interaction.editReply({
                components: [
                    new ActionRowBuilder<GargoyleUserSelectMenuBuilder>().addComponents(
                        new GargoyleUserSelectMenuBuilder(this, 'invite')
                            .setPlaceholder('Select member(s) to invite.')
                            .setMaxValues(1)
                            .setMinValues(1)
                    )
                ]
            });
            break;
        }
        case 'rename': {
            client.logger.trace(`User ${interaction.user.username} tried to rename their vc.`);
            // Send a modal with a text input to choose the name.
            const maxLength = 25; // - client.db.guilds.get(interaction.guild.id).dynvcs.prefix.length;
            interaction.showModal(
                new GargoyleModalBuilder(this, 'rename')
                    .setTitle('Rename the VC')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('name')
                                .setPlaceholder('Cool VC!')
                                .setMaxLength(maxLength)
                                .setMinLength(1)
                                .setRequired(true)
                                .setLabel('New name for the VC.')
                                .setStyle(TextInputStyle.Short)
                        )
                    )
            );
            break;
        }
        case 'claim': {
            client.logger.trace(`User ${interaction.user.username} claimed a vc.`);
            // Claim the vc
            // Check if any of the members in the vc are the owner
            let owner;

            vc.members.forEach((member) => {
                if (
                    vc.permissionOverwrites.resolve(member.id) &&
                        vc.permissionOverwrites.resolve(member.id)?.allow.has(PermissionFlagsBits.AddReactions)
                )
                    owner = member;
            });

            if (owner) {
                interaction.editReply({ content: 'The owner is still in the vc!' });
                return;
            }

            // Claim the vc
            vc.permissionOverwrites.edit(interaction.user.id, {
                AddReactions: true,
                Connect: true
            });

            interaction.editReply({ content: 'You have claimed the vc!' });
            break;
        }
        }
        interaction.message.edit(this.panelMessage as MessageEditOptions);
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (!interaction.guildId || !interaction.user.id) return;
        if (client.user === null) return;

        const vc = client.guilds.cache.get(interaction.guildId)?.members.cache.get(interaction.user.id)?.voice.channel;

        if (!vc) {
            interaction.reply({ content: 'You need to be in a voice channel to use this button!', flags: MessageFlags.Ephemeral });
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
        ) {
            interaction.reply({ content: 'This is not a dynamic vc!', flags: MessageFlags.Ephemeral });
            return;
        }

        switch (args[0]) {
        case 'rename': {
            vc.edit({ name: interaction.fields.getTextInputValue('name') })
                .catch(() => {
                    interaction.reply({ content: 'Failed to rename the vc!', flags: MessageFlags.Ephemeral });
                })
                .then(() => {
                    interaction.reply({
                        content: `Renamed the vc to ${interaction.fields.getTextInputValue('name')}`,
                        flags: MessageFlags.Ephemeral
                    });
                });

            break;
        }
        }
    }

    public override executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): void {
        if (!interaction.guildId) return;
        if (!interaction.user.id) return;
        if (client.user === null) return;

        const vc = client.guilds.cache.get(interaction.guildId)?.members.cache.get(interaction.user.id)?.voice.channel;

        if (!vc) {
            interaction.reply({ content: 'You need to be in a voice channel to use this button!', flags: MessageFlags.Ephemeral });
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
        ) {
            interaction.reply({ content: 'This is not a dynamic vc!', flags: MessageFlags.Ephemeral });
            return;
        }

        switch (args[0]) {
        case 'ban': {
            interaction.values.forEach((value) => {
                if (!interaction.guildId) return;

                const member = client.guilds.cache.get(interaction.guildId)?.members.cache.get(value);
                if (member) {
                    vc.permissionOverwrites.edit(member.id, { Connect: false });
                    interaction.reply({ content: `Banned ${member.user.tag} from the vc!`, flags: MessageFlags.Ephemeral });
                    vc.members.get(member.id)?.voice.setChannel(null);
                }
            });
            break;
        }
        case 'invite': {
            interaction.values.forEach((value) => {
                if (!interaction.guildId) return;

                const member = client.guilds.cache.get(interaction.guildId)?.members.cache.get(value);
                if (member) {
                    vc.permissionOverwrites.edit(member.id, { Connect: true });
                    interaction.reply({ content: `Invited ${member.user.tag} to the vc!`, flags: MessageFlags.Ephemeral });
                }
            });
            break;
        }
        }
    }

    private panelMessage: string | InteractionReplyOptions | MessageEditOptions | MessageCreateOptions | MessagePayload = {
        content: null,
        embeds: [
            new GargoyleEmbedBuilder()
                .setTitle('Voicechat Commands')
                .setDescription(
                    'Create a new VC to use this.\n\n**Buttons**\n' +
                        '<:Lock:1206326940324331531> Lock/Unlock the VC\n' +
                        '<:Eye:1206326935303749722> Hide/Show the VC\n' +
                        '<:Plus:1206326946586300476> Increase the VC limit\n' +
                        '<:Minus:1206326944979877990> Decrease the VC limit\n' +
                        '<:Hammer:1206326936612114472> Ban from the VC\n' +
                        '<:Mail:1206667313609187330> Unban / Invite to the VC\n' +
                        '<:I_:1206326937748905985> Rename the VC\n' +
                        '<:Mic:1206326943201362060> Claim the VC\n'
                )
        ],
        components: [
            new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([
                new GargoyleButtonBuilder(this, 'lock').setEmoji('<:Lock:1206326940324331531>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'hide').setEmoji('<:Eye:1206326935303749722>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'increase').setEmoji('<:Plus:1206326946586300476>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'decrease').setEmoji('<:Minus:1206326944979877990>').setStyle(ButtonStyle.Secondary)
            ]),
            new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([
                new GargoyleButtonBuilder(this, 'ban').setEmoji('<:Hammer:1206326936612114472>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'invite').setEmoji('<:Mail:1206667313609187330>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'rename').setEmoji('<:I_:1206326937748905985>').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'claim').setEmoji('<:Mic:1206326943201362060>').setStyle(ButtonStyle.Secondary)
            ])
        ]
    };

    public override events = [new VoiceUpdate()];
}

class VoiceUpdate extends GargoyleEvent {
    public event = Events.VoiceStateUpdate as const;

    public execute(client: GargoyleClient, oldState: VoiceState, newState: VoiceState): void {
        if (!newState.guild) return;
        if (!newState.member) return;
        if (!client.user) return;

        if (newState.channel) {
            // User joined a channel
            if (
                newState.channel.permissionOverwrites.resolve(oldState.client.user.id) &&
                newState.channel.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.PrioritySpeaker) // Bot has priority speaker in the channel so it is a lobby
            ) {
                const channel = newState.guild.channels.cache.find(
                    (c) =>
                        c.type === ChannelType.GuildVoice &&
                        newState.member &&
                        c.permissionOverwrites.resolve(newState.member.id) &&
                        c.permissionOverwrites.resolve(newState.member.id)?.allow.has(PermissionFlagsBits.AddReactions) &&
                        c.permissionOverwrites.resolve(oldState.client.user.id) &&
                        c.permissionOverwrites.resolve(oldState.client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
                ); // Channel has perm overrides for add reactions for the user and bot so the vc is a dynamic vc

                if (channel) {
                    // Drag the user to the channel they own
                    newState.member.voice.setChannel(channel as VoiceChannel).catch(() => {});
                } else {
                    // Create a new channel for the user with the same permissions as the
                    // category if the channel they joined has a category

                    // Make the name the first 25 characters of the next string

                    let name =
                        // newState.client.db.guilds.get(newState.guild.id).dynvcs.prefix +
                        newState.member.nickname || newState.member.user.username;
                    if (name.length > 25) name = name.slice(0, 25);

                    newState.guild.channels
                        .create({
                            name: name,
                            type: ChannelType.GuildVoice,
                            parent: newState.channel.parent ? newState.channel.parent : null
                        })
                        .catch(() => {
                            newState.member
                                ?.send(
                                    `<@!${newState.member.id}> I don't have permission to create a channel in the category you are in. Please make sure I have the correct permissions and try again.\nContact your server administrator if you need help.`
                                )
                                .catch(() => {});

                            newState.guild.fetchOwner().then((owner) => {
                                owner
                                    .send(
                                        `I don't have permission to send messages in any channel in ${newState.guild.name}. Please give me permission to send messages in a channel and try again.`
                                    )
                                    .catch(() => {});
                            });

                            client.logger.warning(`${newState.guild.name}, incorrectly configured permissions.`);
                        })
                        .then((channel) => {
                            if (!channel) return;
                            // Add the permission overrides for the user
                            channel
                                .lockPermissions()
                                .then((channel) => {
                                    channel.permissionOverwrites
                                        .create(newState.member?.id ?? '', {
                                            AddReactions: true,
                                            Connect: true
                                        })
                                        .catch(() => {});
                                    channel.permissionOverwrites.create(oldState.client.user.id, { AddReactions: true }).catch(() => {});

                                    // Move the user to the channel
                                    if (newState.member) newState.member.voice.setChannel(channel).catch(() => {});
                                })
                                .catch(() => {
                                    channel.permissionOverwrites
                                        .create(newState.member?.id ?? '', {
                                            AddReactions: true,
                                            Connect: true
                                        })
                                        .catch(() => {});
                                    channel.permissionOverwrites.create(oldState.client.user.id, { AddReactions: true }).catch(() => {});

                                    // Move the user to the channel
                                    if (newState.member) newState.member.voice.setChannel(channel).catch(() => {});
                                });
                        });
                }
            }
        }
        if (oldState.channel) {
            // User left a channel
            oldState.guild.channels.cache.forEach((channel) => {
                if (
                    channel.type === ChannelType.GuildVoice &&
                    channel.permissionOverwrites.resolve(oldState.client.user.id) &&
                    channel.permissionOverwrites.resolve(oldState.client.user.id)?.allow.has(PermissionFlagsBits.AddReactions) &&
                    channel.members.size === 0
                ) {
                    // Delete the channel
                    channel.delete().catch(() => {});
                }
            });
        }
    }
}
