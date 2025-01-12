/**
 * @fileoverview This module provides custom select menu builders for various types of select menus in Discord.js.
 * Each builder class extends the corresponding select menu builder from Discord.js and sets a custom ID based on the command and argument provided.
 *
 * @module gargoyleSelectMenuBuilders
 */

import {
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder
} from 'discord.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

/**
 * A custom string select menu builder that sets a custom ID based on the provided command and argument.
 *
 * @class
 * @extends StringSelectMenuBuilder
 */
class GargoyleStringSelectMenuBuilder extends StringSelectMenuBuilder {
    /**
     * Creates an instance of GargoyleStringSelectMenuBuilder.
     *
     * @param {GargoyleCommand} command - The command associated with this select menu.
     * @param {string} argument - The argument to be included in the custom ID.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`
        );
    }

    public addOption(label: string, value: string): this {
        return super.addOptions({
            label: label,
            value: value
        });
    }
}

/**
 * A custom user select menu builder that sets a custom ID based on the provided command and argument.
 *
 * @class
 * @extends UserSelectMenuBuilder
 */
class GargoyleUserSelectMenuBuilder extends UserSelectMenuBuilder {
    /**
     * Creates an instance of GargoyleUserSelectMenuBuilder.
     *
     * @param {GargoyleCommand} command - The command associated with this select menu.
     * @param {string} argument - The argument to be included in the custom ID.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`
        );
    }
}

/**
 * A custom role select menu builder that sets a custom ID based on the provided command and argument.
 *
 * @class
 * @extends RoleSelectMenuBuilder
 */
class GargoyleRoleSelectMenuBuilder extends RoleSelectMenuBuilder {
    /**
     * Creates an instance of GargoyleRoleSelectMenuBuilder.
     *
     * @param {GargoyleCommand} command - The command associated with this select menu.
     * @param {string} argument - The argument to be included in the custom ID.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`
        );
    }
}

/**
 * A custom mentionable select menu builder that sets a custom ID based on the provided command and argument.
 *
 * @class
 * @extends MentionableSelectMenuBuilder
 */
class GargoyleMentionableSelectMenuBuilder extends MentionableSelectMenuBuilder {
    /**
     * Creates an instance of GargoyleMentionableSelectMenuBuilder.
     *
     * @param {GargoyleCommand} command - The command associated with this select menu.
     * @param {string} argument - The argument to be included in the custom ID.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`
        );
    }
}

/**
 * A custom channel select menu builder that sets a custom ID based on the provided command and argument.
 *
 * @class
 * @extends ChannelSelectMenuBuilder
 */
class GargoyleChannelSelectMenuBuilder extends ChannelSelectMenuBuilder {
    /**
     * Creates an instance of GargoyleChannelSelectMenuBuilder.
     *
     * @param {GargoyleCommand} command - The command associated with this select menu.
     * @param {string} argument - The argument to be included in the custom ID.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`
        );
    }
}

export {
    GargoyleStringSelectMenuBuilder,
    GargoyleUserSelectMenuBuilder,
    GargoyleRoleSelectMenuBuilder,
    GargoyleMentionableSelectMenuBuilder,
    GargoyleChannelSelectMenuBuilder
};
