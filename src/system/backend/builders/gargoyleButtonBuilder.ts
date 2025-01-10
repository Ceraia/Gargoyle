import { ButtonBuilder, ButtonStyle } from 'discord.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

/**
 * A builder class for creating Gargoyle buttons with specific commands and arguments.
 * Extends the `ButtonBuilder` class.
 *
 * @class
 * @extends ButtonBuilder
 */
class GargoyleButtonBuilder extends ButtonBuilder {
    /**
     * Creates an instance of GargoyleButtonBuilder.
     *
     * @constructor
     * @param {GargoyleCommand} command - The command associated with the button.
     * @param {string} argument - The argument to be used for the button label and custom ID.
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
        this.setStyle(ButtonStyle.Primary);
        this.setDisabled(false);
    }
}

export default GargoyleButtonBuilder;
