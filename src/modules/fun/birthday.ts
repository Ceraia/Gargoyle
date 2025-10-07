import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import Emojis from '@src/system/backend/tools/emojis.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    TextDisplayBuilder
} from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Birthday extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('birthday')
            .setDescription('Set or view your birthday')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('set')
                    .setDescription('Set your birthday')
                    .addIntegerOption((option) =>
                        option.setName('day').setDescription('Your birthday').setRequired(true).setMinValue(1).setMaxValue(31)
                    )
                    .addStringOption((option) =>
                        option
                            .setName('month')
                            .setDescription('Your birth month')
                            .setRequired(true)
                            .addChoices(
                                { name: 'January', value: '0' },
                                { name: 'February', value: '1' },
                                { name: 'March', value: '2' },
                                { name: 'April', value: '3' },
                                { name: 'May', value: '4' },
                                { name: 'June', value: '5' },
                                { name: 'July', value: '6' },
                                { name: 'August', value: '7' },
                                { name: 'September', value: '8' },
                                { name: 'October', value: '9' },
                                { name: 'November', value: '10' },
                                { name: 'December', value: '11' }
                            )
                    )
                    .addIntegerOption(
                        (option) =>
                            option
                                .setName('year')
                                .setDescription('Your birth year')
                                .setRequired(false)
                                .setMinValue(new Date().getFullYear() - 110)
                                .setMaxValue(new Date().getFullYear() - 12) // At least 13 years old to use Discord
                    )
            )
            .addSubcommand((subcommand) => subcommand.setName('opt-out').setDescription('Remove your birthday from the database'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('view')
                    .setDescription('View your or another users birthday (optional)')
                    .addUserOption((option) => option.setName('user').setDescription('The user to view the birthday of').setRequired(false))
            ) as GargoyleSlashCommandBuilder
    ];

    private birthdaySetups: Map<string, Date> = new Map();

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'birthday') {
            if (!client.db) {
                await interaction.reply({ content: 'Database connection is not available.', flags: MessageFlags.Ephemeral });
                return;
            }
            if (interaction.options.getSubcommand() === 'set') {
                const day = interaction.options.getInteger('day', true);
                const month = interaction.options.getString('month', true);
                const year = interaction.options.getInteger('year', false) || null;

                if (month === '2' && day > 29) {
                    await interaction.reply({ content: 'February only has 29 days at most.', flags: MessageFlags.Ephemeral });
                    return;
                }
                if ([4, 6, 9, 11].includes(parseInt(month)) && day > 30) {
                    await interaction.reply({ content: 'The selected month only has 30 days.', flags: MessageFlags.Ephemeral });
                    return;
                }

                const birthdayDate = new Date();
                birthdayDate.setUTCDate(day);
                birthdayDate.setUTCMonth(parseInt(month));
                if (year) birthdayDate.setUTCFullYear(year);
                else birthdayDate.setUTCFullYear(1000); // Default year if not provided

                this.birthdaySetups.set(interaction.user.id, birthdayDate);

                await interaction.reply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `${Emojis.WhiteConfetti} Your Birthday is set for **${birthdayDate.toLocaleDateString('en-US', {
                                        year: year ? 'numeric' : undefined,
                                        month: 'long',
                                        day: 'numeric'
                                    })}**.` +
                                        `\n-# **Keep in mind that this information is public, and will be shown to everyone in guilds you share on your birthday.**` +
                                        `\n-# You can remove it at any time with \`/birthday opt-out\`.`
                                )
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                    new GargoyleButtonBuilder(this, 'confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
                                    new GargoyleButtonBuilder(this, 'cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                                )
                            )
                    ],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            } else if (interaction.options.getSubcommand() === 'opt-out') {
                const dbBirthday = await databaseUserBirthdays.findOneAndDelete({ userId: interaction.user.id }).catch((err: Error) => {
                    client.logger.error(`Failed to remove birthday for user ${interaction.user.id}: ${err.stack}`);
                });
                if (!dbBirthday) {
                    await interaction.reply({ content: 'You do not have a birthday set.', flags: MessageFlags.Ephemeral });
                    return;
                }
                await interaction.reply({ content: 'Your birthday has been removed from the database.', flags: MessageFlags.Ephemeral });
            } else if (interaction.options.getSubcommand() === 'view') {
                const user = interaction.options.getUser('user', false) || interaction.user;
                const dbBirthday = await databaseUserBirthdays.findOne({ userId: user.id }).catch((err: Error) => {
                    client.logger.error(`Failed to fetch birthday for user ${user.id}: ${err.stack}`);
                });
                if (!dbBirthday) {
                    if (user.id === interaction.user.id) {
                        await interaction.reply({ content: 'You do not have a birthday set.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: `${user.username} does not have a birthday set.`, flags: MessageFlags.Ephemeral });
                    }
                    return;
                }
                const birthday = new Date();
                birthday.setUTCDate(dbBirthday.day);
                birthday.setUTCMonth(dbBirthday.month);
                if (dbBirthday.year) birthday.setUTCFullYear(dbBirthday.year);
                else birthday.setUTCFullYear(1000);

                if (user.id === interaction.user.id) {
                    await interaction.reply({
                        content: `Your birthday is set to **${birthday.toLocaleDateString('en-US', {
                            year: dbBirthday.year ? 'numeric' : undefined,
                            month: 'long',
                            day: 'numeric'
                        })}**.`,
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: `${user.username}'s birthday is set to **${birthday.toLocaleDateString('en-US', {
                            year: dbBirthday.year ? 'numeric' : undefined,
                            month: 'long',
                            day: 'numeric'
                        })}**.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else {
                await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
            }
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'confirm') {
            const birthday = this.birthdaySetups.get(interaction.user.id);
            if (!birthday) {
                interaction.reply({ content: 'No birthday setup found to confirm.', flags: MessageFlags.Ephemeral });
                return;
            }
            const birthdayData = {
                userId: interaction.user.id,
                day: birthday.getUTCDate(),
                month: birthday.getUTCMonth(),
                year: birthday.getUTCFullYear() === 1000 ? null : birthday.getUTCFullYear()
            };

            const dbBirthday = await databaseUserBirthdays
                .findOneAndUpdate({ userId: interaction.user.id }, birthdayData, { upsert: true, new: true })
                .catch(async (err: Error) => {
                    client.logger.error(`Failed to set birthday for user ${interaction.user.id}: ${err.stack}`);
                    await interaction.reply({
                        content: 'There was an error setting your birthday. Please try again later.',
                        flags: MessageFlags.Ephemeral
                    });
                });

            if (!dbBirthday) return;
            await interaction.reply({
                content: `Your birthday has been set to **${birthday.toLocaleDateString('en-US', {
                    year: birthdayData.year ? 'numeric' : undefined,
                    month: 'long',
                    day: 'numeric'
                })}** ${Emojis.WhiteConfetti}`,
                flags: MessageFlags.Ephemeral
            });
            this.birthdaySetups.delete(interaction.user.id);

            return;
        } else if (args[0] === 'cancel') {
            this.birthdaySetups.delete(interaction.user.id);
            interaction.reply({ content: 'Birthday setup has been cancelled.', flags: MessageFlags.Ephemeral });
            return;
        }
    }
}

const birthdayUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    day: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: false
    }
});

const databaseUserBirthdays = model('Birthdays', birthdayUserSchema);
