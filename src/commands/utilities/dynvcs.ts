import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleUserSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    InteractionContextType,
    InteractionReplyOptions,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessagePayload,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    VoiceChannel
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
        .setDescription('Replies with Pong!')
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
                interaction.reply({ content: 'You need the `MANAGE_CHANNELS` permission to use this command!', ephemeral: true });
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

            interaction.reply({ content: 'Created the dynamic vc!', ephemeral: true });
        }
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        (message.channel as TextChannel).send(this.panelMessage as MessageCreateOptions);
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

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

            vc.edit({ userLimit: vc.userLimit - 1 }).catch(() => {});
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
                        new GargoyleUserSelectMenuBuilder(this, 'ban').setPlaceholder('Select member(s) to ban.').setMaxValues(25).setMinValues(1)
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
                            .setMaxValues(25)
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
        interaction.update(this.panelMessage as MessageEditOptions);
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (!interaction.guildId || !interaction.user.id) return;
        if (client.user === null) return;

        const vc = client.guilds.cache.get(interaction.guildId)?.members.cache.get(interaction.user.id)?.voice.channel;

        if (!vc) {
            interaction.reply({ content: 'You need to be in a voice channel to use this button!' });
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
        ) {
            interaction.reply({ content: 'This is not a dynamic vc!' });
            return;
        }

        switch (args[0]) {
        case 'rename': {
            vc.edit({ name: interaction.fields.getTextInputValue('name') })
                .catch(() => {
                    interaction.reply({ content: 'Failed to rename the vc!' });
                })
                .then(() => {
                    interaction.reply({ content: `Renamed the vc to ${interaction.fields.getTextInputValue('name')}` });
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
            interaction.reply({ content: 'You need to be in a voice channel to use this button!' });
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AddReactions)
        ) {
            interaction.reply({ content: 'This is not a dynamic vc!' });
            return;
        }

        switch (args[0]) {
        case 'ban': {
            interaction.values.forEach((value) => {
                if (!interaction.guildId) return;

                const member = client.guilds.cache.get(interaction.guildId)?.members.cache.get(value);
                if (member) {
                    vc.permissionOverwrites.edit(member.id, { Connect: false });
                    interaction.reply({ content: `Banned ${member.user.tag} from the vc!` });
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
                    interaction.reply({ content: `Invited ${member.user.tag} to the vc!` });
                }
            });
            break;
        }
        }
    }

    private panelMessage: string | InteractionReplyOptions | MessageEditOptions | MessageCreateOptions | MessagePayload = {
        content: null,
        embeds: [new GargoyleEmbedBuilder().setTitle('Voicechat Commands')],
        components: [
            new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([
                new GargoyleButtonBuilder(this, 'lock').setLabel('Lock').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'hide').setLabel('Hide').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'increase').setLabel('Increase').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'decrease').setLabel('Decrease').setStyle(ButtonStyle.Secondary)
            ]),
            new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([
                new GargoyleButtonBuilder(this, 'ban').setLabel('Ban').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'invite').setLabel('Invite').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'rename').setLabel('Rename').setStyle(ButtonStyle.Secondary),
                new GargoyleButtonBuilder(this, 'claim').setLabel('Claim').setStyle(ButtonStyle.Secondary)
            ])
        ]
    };
}
