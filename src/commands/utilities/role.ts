import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import { GargoyleRoleSelectMenuBuilder } from '@builders/gargoyleSelectMenuBuilders.js';
import { sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    ContainerBuilder,
    HexColorString,
    InteractionContextType,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    Role,
    RoleSelectMenuBuilder,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import client from '@src/system/botClient.js';

export default class RoleCommand extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('role')
            .setDescription('Role related commands')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('button')
                    .setDescription('Create a button that gives a role')
                    .addBooleanOption((option) => option.setRequired(true).setName('panel').setDescription('Whether the message contain a panel'))
            )
            .addSubcommandGroup((group) =>
                group
                    .setName('create')
                    .setDescription('Create a role')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('color')
                            .setDescription('Create a role with a color')
                            .addStringOption((option) => option.setRequired(true).setName('color').setDescription('The color of the role'))
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('delete')
                    .setDescription('Delete a role')
                    .addRoleOption((option) => option.setRequired(true).setName('role').setDescription('The role to delete'))
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override textCommands = [
        new GargoyleTextCommandBuilder()
            .setName('buttonrole')
            .setDescription('Create a role button')
            .addAlias('br')
            .addAlias('rolebutton')
            .addAlias('rb')
            .setContexts([InteractionContextType.Guild])
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommandGroup(false) == null) {
            if (interaction.options.getSubcommand() === 'button') {
                if (!interaction.memberPermissions?.has('ManageRoles')) {
                    await interaction.reply({
                        content: 'You do not have the required permissions to use this command.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                await interaction.reply({
                    content: 'What role(s) would you like to give?',
                    flags: MessageFlags.Ephemeral,
                    components: [
                        new ActionRowBuilder<GargoyleRoleSelectMenuBuilder>().addComponents(
                            new GargoyleRoleSelectMenuBuilder(this, 'roles', interaction.options.getBoolean('panel', false) ? 'panel' : 'nopanel')
                                .setMaxValues(25)
                                .setMinValues(1)
                                .setPlaceholder('Select role(s) to give')
                        )
                    ]
                });
            } else if (interaction.options.getSubcommand() === 'delete') {
                if (!interaction.memberPermissions?.has('ManageRoles')) {
                    await interaction.reply({
                        content: 'You do not have the required permissions to use this command.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                const role = interaction.options.getRole('role', false);
                if (!role) {
                    await interaction.reply({
                        content: 'The role you provided is not valid.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if ('delete' in role) {
                    await role.delete(`Role deleted by ${interaction.user.tag}`);
                } else {
                    await interaction.reply({
                        content: 'The role you provided cannot be deleted.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                await interaction.reply({
                    content: `Deleted role ${role.name}`,
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (interaction.options.getSubcommandGroup() === 'create') {
            if (interaction.options.getSubcommand() === 'color') {
                if (!interaction.memberPermissions?.has('ManageRoles')) {
                    await interaction.reply({
                        content: 'You do not have the required permissions to use this command.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // Check with regex if the color is a valid hex color
                const color = interaction.options.getString('color', false);
                if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
                    await interaction.reply({
                        content: 'The color you provided is not a valid hex color.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const response = await fetch('https://www.thecolorapi.com/id?hex=' + color?.substring(1));
                const data = (await response.json()) as ColorApiResponse;
                const colorName = data.name.value;

                const role = await interaction.guild?.roles.create({
                    name: `Color - ${colorName}`,
                    color: color as HexColorString,
                    reason: `Color role created by ${interaction.user.tag}`,
                    permissions: [],
                    mentionable: false
                });

                if (!role) {
                    await interaction.reply({
                        content: 'Failed to create role.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                await interaction.reply({
                    content: `Created role ${role} with color ${colorName}`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }

    public override async executeTextCommand(_client: GargoyleClient, message: Message) {
        if (!message.member?.permissions?.has('ManageRoles')) {
            await message.reply({ content: 'You do not have the required permissions to use this command.' });
            return;
        }
        (message.channel as TextChannel).send({
            content: 'What role(s) would you like to give?',
            components: [
                new ActionRowBuilder<GargoyleRoleSelectMenuBuilder>().addComponents(
                    new GargoyleRoleSelectMenuBuilder(this, 'roles').setMaxValues(25).setMinValues(1).setPlaceholder('Select role(s) to give')
                )
            ]
        });
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        if (interaction.channel === null) return;
        if (interaction.isRoleSelectMenu()) {
            if (args[0] === 'roles') {
                const roles = interaction.values;

                const member = await interaction.guild?.members.fetch(interaction.user.id);
                const channel = (await client.channels.fetch(interaction.channel.id)) as TextChannel;

                if (!member || !channel) {
                    await interaction.update({ content: 'An unexpected error occured, are you in a guild?' });
                    return;
                }

                let message: MessageEditOptions = { content: 'Internal Component Message, if you see this then something has gone pretty wrong...' };

                if (args.length > 1 && args[1] == 'panel') {
                    const container = new ContainerBuilder();
                    let rolesFetched: Role[] = [];

                    for (const roleId of roles) {
                        const role = interaction.guild?.roles.cache.get(roleId);
                        role ? rolesFetched.push(role) : null;
                        container.addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`<@&${roleId}>`))
                                .setButtonAccessory(
                                    new GargoyleButtonBuilder(this, 'addrole', roleId).setLabel('Add Role').setStyle(ButtonStyle.Secondary)
                                )
                        );
                    }

                    const averageRole = averageRoleColor(rolesFetched);

                    container.setAccentColor(averageRole);

                    message = { components: [container], flags: [MessageFlags.IsComponentsV2] };
                } else {
                    const componentCollection: ActionRowBuilder<GargoyleButtonBuilder>[] = [];

                    let roleCount = 0;
                    let actionRow = new ActionRowBuilder<GargoyleButtonBuilder>();
                    for (const roleId of roles) {
                        roleCount++;
                        const role = await interaction.guild?.roles.fetch(roleId);
                        if (!role) continue;

                        if (role.position >= member.roles.highest.position && member.guild.ownerId !== member.id) {
                            interaction
                                .reply({
                                    content: `You cannot give yourself the role ${role.name} as it is higher than your highest role.`,
                                    flags: MessageFlags.Ephemeral
                                })
                                .catch(() => {});

                            return;
                        }

                        actionRow.addComponents(
                            new GargoyleButtonBuilder(this, 'addrole', role?.id).setLabel(role?.name).setStyle(ButtonStyle.Secondary)
                        );
                        if (roleCount === 5) {
                            roleCount = 0;
                            componentCollection.push(actionRow);
                            actionRow = new ActionRowBuilder<GargoyleButtonBuilder>();
                        }
                    }
                    if (roleCount > 0) {
                        componentCollection.push(actionRow);
                    }

                    message = { components: componentCollection };
                }

                message = {
                    content: '',
                    components: [
                        ...(message.components ?? []),
                        new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
                            new GargoyleRoleSelectMenuBuilder(this, 'roles', args.length > 1 && args[1] == 'panel' ? 'panel' : 'nopanel')
                                .setMaxValues(25)
                                .setMinValues(1)
                                .setDefaultRoles(roles)
                                .setPlaceholder('Select role(s) to give')
                        ),
                        new ActionRowBuilder<GargoyleButtonBuilder>().setComponents(new GargoyleButtonBuilder(this, 'submit').setLabel('Submit'))
                    ],
                    flags: message.flags
                };

                await interaction.update(message);
            }
        }
    }

    public override async executeButtonCommand(_client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'addrole') {
            const role = await interaction.guild?.roles.fetch(args[1]);
            if (!role) return;

            const member = await interaction.guild?.members.fetch(interaction.user.id);

            if (member?.roles.cache.has(role.id)) {
                await member?.roles
                    .remove(role)
                    .catch(() => {
                        interaction.reply({
                            content: `Failed to remove role ${role.name}, I may not have the correct permissions to take it away from you.`,
                            flags: MessageFlags.Ephemeral
                        });
                    })
                    .then(() => {
                        interaction.reply({ content: `Removed role ${role.name}`, flags: MessageFlags.Ephemeral });
                    });
            } else {
                await member?.roles
                    .add(role)
                    .catch(() => {
                        interaction.reply({
                            content: `Failed to add role ${role.name}, I may not have the correct permissions to give it to you.`,
                            flags: MessageFlags.Ephemeral
                        });
                    })
                    .then(() => {
                        interaction.reply({ content: `Added role ${role.name}`, flags: MessageFlags.Ephemeral });
                    });
            }
        } else if (args[0] === 'submit') {
            if (!interaction.guild) return;
            const message: MessageCreateOptions = {
                content: undefined,
                components: [...(interaction.message.components ?? []).slice(0, -2)],
                flags: interaction.message.flags.bitfield,
                allowedMentions: { parse: [] }
            };
            try {
                await interaction.update({
                    components: [
                        new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
                            new GargoyleRoleSelectMenuBuilder(
                                this,
                                'roles',
                                interaction.message.components.filter((component) => component.type === ComponentType.Container).length > 0
                                    ? 'panel'
                                    : 'nopanel'
                            )
                                .setMaxValues(25)
                                .setMinValues(1)
                                .setDefaultRoles()
                                .setPlaceholder('Select role(s) to give')
                        )
                    ]
                });

                await sendAsServer(client, message, interaction.channel as TextChannel);
            } catch (err) {
                client.logger.error('Failed to make panel', err as string);
                await interaction.update({
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                'Failed to make server message. Did you submit any roles? And do I have the right permissions?'
                            )
                        ),
                        new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
                            new GargoyleRoleSelectMenuBuilder(this, 'roles', args.length > 1 && args[1] == 'panel' ? 'panel' : 'nopanel')
                                .setMaxValues(25)
                                .setMinValues(1)
                                .setDefaultRoles()
                                .setPlaceholder('Select role(s) to give')
                        )
                    ]
                });
            }
        }
    }
}

function averageRoleColor(roles: Role[]) {
    const roleColors = roles.map((role) => role.color).filter((color) => color !== undefined && typeof color === 'number' && color !== 0);

    if (roleColors.length === 0) return 0x2b2d31; // Default to discord default color if no roles are found

    const rgbValues = roleColors.map((color) => {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return { r, g, b };
    });

    const averageRgb = rgbValues.reduce(
        (acc, rgb) => {
            acc.r += rgb.r;
            acc.g += rgb.g;
            acc.b += rgb.b;
            return acc;
        },
        { r: 0, g: 0, b: 0 }
    );

    averageRgb.r = Math.round(averageRgb.r / rgbValues.length);
    averageRgb.g = Math.round(averageRgb.g / rgbValues.length);
    averageRgb.b = Math.round(averageRgb.b / rgbValues.length);

    return (averageRgb.r << 16) + (averageRgb.g << 8) + averageRgb.b;
}

interface ColorApiResponse {
    hex: {
        value: string;
        clean: string;
    };
    rgb: {
        fraction: {
            r: number;
            g: number;
            b: number;
        };
        r: number;
        g: number;
        b: number;
        value: string;
    };
    hsl: {
        fraction: {
            h: number;
            s: number;
            l: number;
        };
        h: number;
        s: number;
        l: number;
        value: string;
    };
    hsv: {
        fraction: {
            h: number;
            s: number;
            v: number;
        };
        h: number;
        s: number;
        v: number;
        value: string;
    };
    name: {
        value: string;
        closest_named_hex: string;
        exact_match_name: boolean;
        distance: number;
    };
    cmyk: {
        fraction: {
            c: number;
            m: number;
            y: number;
            k: number;
        };
        value: string;
        c: number;
        m: number;
        y: number;
        k: number;
    };
    XYZ: {
        fraction: {
            X: number;
            Y: number;
            Z: number;
        };
        value: string;
        X: number;
        Y: number;
        Z: number;
    };
    image: {
        bare: string;
        named: string;
    };
    contrast: {
        value: string;
    };
    _links: {
        self: {
            href: string;
        };
    };
    _embedded: Record<string, unknown>;
}
