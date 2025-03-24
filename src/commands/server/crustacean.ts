import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ChatInputCommandInteraction, Events, GuildMember, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';

export default class Server extends GargoyleCommand {
    public override category: string = 'server';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('crustacean')
            .setDescription('Crustacean invite system')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addSubcommand((subcommand) => subcommand.setName('info').setDescription('Get information about the crustacean system'))
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'info') {
            interaction.reply({
                embeds: [
                    new GargoyleEmbedBuilder()
                        .setTitle('Crustacean Invite System')
                        .setDescription(
                            `Crustacean is a custom invite & invite tracking system for your server.\n` +
                                `Crustacean is a W.I.P system to allow you to more accurately "whitelist" who gets access to your server, primarily meant for communities who value reputation of members.\n` +
                                `Crustacean is not meant to replace the default Discord invite system, but rather to supplement it.\n` +
                                `In short, as people's minds have atrophied and cannot be bothered to read all text;\n\n` +
                                `- Track invitations, and see who invited who. \n` +
                                `- Track reputation of members, and add merit accordingly. \n` +
                                `- Track in-game names of members (for whitelisting for minecraft for example). \n\n` +
                                `-# Crustacean is a work in progress, and may not work as expected, any bugs and feature requests can be forwarded to \`@axodouble.\``
                        )
                ],
                flags: MessageFlags.Ephemeral
            });
        }
    }

    public override events: GargoyleEvent[] = [new MemberJoin()];
}

class MemberJoin extends GargoyleEvent {
    public event = Events.GuildMemberAdd as const;

    public execute(_client: GargoyleClient, _member: GuildMember): void {
        // // Check what invite the user used to join the server
        // member.guild.fetchInvites().then((invites) => {
        //     const invite = invites.find((invite) => invite.uses! < invite.maxUses!);
        //     if (invite) {
    }
}
