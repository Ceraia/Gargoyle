import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import { GargoyleRoleSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    InteractionContextType,
    Message,
    SlashCommandBuilder,
    TextChannel
} from 'discord.js';

export default class ButtonRole extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('rolebutton')
        .setDescription('Create a button that gives a role')
        .setContexts([InteractionContextType.Guild]);
    public override textCommand = new TextCommandBuilder()
        .setName('buttonrole')
        .setDescription('Create a role button')
        .addAlias('br')
        .addAlias('rolebutton')
        .addAlias('rb')
        .setContexts([InteractionContextType.Guild]);

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageRoles')) {
            await interaction.reply({ content: 'You do not have the required permissions to use this command.', ephemeral: true });
            return;
        }
        await interaction.reply({
            content: 'What role(s) would you like to give?',
            ephemeral: true,
            components: [
                new ActionRowBuilder<GargoyleRoleSelectMenuBuilder>().addComponents(
                    new GargoyleRoleSelectMenuBuilder(this, 'roles').setMaxValues(25).setMinValues(1).setPlaceholder('Select role(s) to give')
                )
            ]
        });
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
                interaction.update({ content: 'Making the button message...', components: [] });

                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (!member) return;

                const channel = (await client.channels.fetch(interaction.channel.id)) as TextChannel;
                if (!channel) return;

                const componentCollection: ActionRowBuilder<GargoyleButtonBuilder>[] = [];

                // For every 5 roles create a new action row
                let roleCount = 0;
                let actionRow = new ActionRowBuilder<GargoyleButtonBuilder>();
                for (const roleId of roles) {
                    roleCount++;
                    const role = await interaction.guild?.roles.fetch(roleId);
                    if (!role) continue;

                    if (role.position >= member?.roles.highest.position) {
                        interaction.reply({
                            content: `You cannot give yourself the role ${role.name} as it is higher than your highest role.`,
                            ephemeral: true
                        });
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

                channel.fetchWebhooks().then(async (webhooks) => {
                    let webhook;

                    if (webhooks.size === 0) {
                        webhook = await channel.createWebhook({ name: 'Role Button', reason: 'Role Button webhook' });
                    } else {
                        webhook = webhooks.first();
                    }

                    webhook?.send({
                        avatarURL: interaction.guild?.iconURL() || undefined,
                        username: interaction.guild?.name || 'Role Button',
                        components: componentCollection
                    });
                });
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
                            ephemeral: true
                        });
                    })
                    .then(() => {
                        interaction.reply({ content: `Removed role ${role.name}`, ephemeral: true });
                    });
            } else {
                await member?.roles
                    .add(role)
                    .catch(() => {
                        interaction.reply({
                            content: `Failed to add role ${role.name}, I may not have the correct permissions to give it to you.`,
                            ephemeral: true
                        });
                    })
                    .then(() => {
                        interaction.reply({ content: `Added role ${role.name}`, ephemeral: true });
                    });
            }
        }
    }
}
