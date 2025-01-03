import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleUserSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    InteractionContextType,
    InteractionReplyOptions,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessagePayload,
    ModalActionRowComponentBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
export default class Ping extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voicechat related commands.')
        .setContexts([InteractionContextType.Guild]);

    public override textCommand = new TextCommandBuilder()
        .setName('voice')
        .setDescription('Replies with Pong!')
        .addAlias('vc')
        .addAlias('voicechat')
        .setContexts([InteractionContextType.Guild]);

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const start = Date.now();
        await interaction.reply('Pong!');
        const end = Date.now();
        await interaction.editReply(`Pong! Latency is ${end - start}ms.`);
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        (message.channel as TextChannel).send(this.panelMessage as MessageCreateOptions);
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId || !interaction.user.id) return;
        if (client.user === null) return;

        const vc = (await (await client.guilds.fetch(interaction.guildId)).members.fetch(interaction.user.id)).voice.channel;

        if (!vc) {
            await interaction
                .editReply({ content: 'You need to be in a voice channel to use this button!' })
                .catch(() =>
                    interaction
                        .editReply({ content: 'You need to be in a voice channel to use this button!' })
                        .catch(() => interaction.reply({ content: 'You need to be in a voice channel to use this button!' }))
                );
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AttachFiles)
        ) {
            interaction.editReply({ content: 'This is not a dynamic vc!' }).catch(() =>
                interaction.reply({
                    content: 'This is not a dynamic vc!',
                    ephemeral: true
                })
            );
            return;
        }

        switch (args[0]) {
        case 'lock': {
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
            // Increase the user limit
            vc.edit({ userLimit: vc.userLimit + 1 });
            interaction.editReply({ content: `Increased the user limit to ${vc.userLimit + 1}!` });
            break;
        }
        case 'decrease': {
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
            // Send a select menu with all the members
            interaction.editReply({
                components: [
                    new ActionRowBuilder<GargoyleUserSelectMenuBuilder>().addComponents(
                        new GargoyleUserSelectMenuBuilder(this, 'ban')
                            .setCustomId('dynvc-ban')
                            .setPlaceholder('Select member(s) to ban.')
                            .setMaxValues(25)
                            .setMinValues(1)
                    )
                ]
            });
            break;
        }
        case 'invite': {
            // Send a select menu with all the members
            interaction.editReply({
                components: [
                    new ActionRowBuilder<GargoyleUserSelectMenuBuilder>().addComponents(
                        new GargoyleUserSelectMenuBuilder(this, 'invite')
                            .setCustomId('dynvc-invite')
                            .setPlaceholder('Select member(s) to invite.')
                            .setMaxValues(25)
                            .setMinValues(1)
                    )
                ]
            });
            break;
        }
        case 'rename': {
            // Send a modal with a text input to choose the name.
            const maxLength = 25; // - client.db.guilds.get(interaction.guild.id).dynvcs.prefix.length;
            interaction.showModal(
                new GargoyleModalBuilder(this, 'rename')
                    .setTitle('Rename the VC')
                    .setCustomId(`dynvc-rename-${vc.id}`)
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
