import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { ChatInputCommandInteraction, Message, MessageFlags, PermissionFlagsBits } from 'discord.js';
import GargoyleSlashCommandBuilder from '../backend/builders/gargoyleSlashCommandBuilder.js';

export default class Manage extends GargoyleCommand {
    override category: string = 'base';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('manage')
            .setDescription('Manage the bot and support')
            .addGuild('750209335841390642')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setPrivate(true)
            .addSubcommandGroup((group) =>
                group
                    .setName('support')
                    .setDescription('Support commands')
                    .addSubcommand((subcommand) => subcommand.setName('guilds').setDescription('List all guilds the bot is in'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('whois')
                            .setDescription('Find a user by ID')
                            .addStringOption((option) => option.setName('id').setDescription('The user ID').setRequired(true))
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('contact')
                            .setDescription('Contact a user for proactive support')
                            .addStringOption((option) => option.setName('id').setDescription('The user ID').setRequired(true))
                            .addStringOption((option) =>
                                option.setName('message').setDescription('The message to send to the user').setRequired(true)
                            )
                    )
            ) as GargoyleSlashCommandBuilder
    ];
    override textCommands = [
        new GargoyleTextCommandBuilder().setName('manage').setDescription('Management').addAlias('mgmt').setPrivate(true),
        new GargoyleTextCommandBuilder().setName('whois').setDescription('Who is this?').setPrivate(true)
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'manage') {
            if (interaction.options.getSubcommandGroup() === 'support') {
                if (interaction.options.getSubcommand() === 'guilds') {
                    const guilds = await client.guilds.fetch();
                    let guildList = '';
                    for (const guild of guilds) {
                        guildList += client.guilds.cache.get(guild[0])?.name + '\n';
                    }
                    await interaction.reply({ content: guildList || 'No guilds found.', flags: [MessageFlags.Ephemeral] });
                } else if (interaction.options.getSubcommand() === 'whois') {
                    const userId = interaction.options.getString('id', true);
                    const user = await client.users.fetch(userId).catch((err) => {
                        interaction.reply({ content: `Error trying to find user: \`${err.message}\``, flags: [MessageFlags.Ephemeral] });
                        return;
                    });

                    if (user) {
                        await interaction.reply({ content: `User: ${user.tag}\nID: ${user.id}`, flags: [MessageFlags.Ephemeral] });
                    }
                } else if (interaction.options.getSubcommand() === 'contact') {
                    const userId = interaction.options.getString('id', true);
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                    const user = await client.users.fetch(userId).catch(async (err) => {
                        await interaction.editReply({ content: `Error trying to find user: \`${err.message}\`` });
                        return;
                    });

                    if (!user) return;

                    const dm = await user.createDM().catch(async (err) => {
                        await interaction.editReply({ content: `Error trying to create DM with user: \`${err.message}\`` });
                        return;
                    });

                    if (!dm) return;

                    dm.send(
                        `Hello ${user.username}, ${interaction.user.tag} has contacted you for support:\n\n${interaction.options.getString('message', true)}`
                    ).catch(async (err) => {
                        await interaction.editReply({ content: `Error trying to send message to user: \`${err.message}\`` });
                        return;
                    });
                }
            }
        } else {
            await interaction.reply({ content: 'Unknown command.', flags: [MessageFlags.Ephemeral] });
        }
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message, ...args: string[]): Promise<void> {
        if (message.author.id !== '244173330431737866') return;
        if (args[0] === 'whois') {
            const user = await client.users.fetch(args[1]).catch(async (err) => {
                await message.reply(`Error trying to find user: \`${err.message}\``);
                return;
            });

            if (user) await message.reply(`User: ${user.tag}\nID: ${user.id}`);
        } else if (args[0] === 'manage' || args[0] === 'mgmt') {
            if (args.length > 1) {
                if (args[1] === 'guilds') {
                    const guilds = await client.guilds.fetch();
                    let guildList = '';
                    for (const guild of guilds) {
                        guildList += client.guilds.cache.get(guild[0])?.name + '\n';
                    }

                    message.member?.send(guildList);
                }
            }
        }
    }
}
