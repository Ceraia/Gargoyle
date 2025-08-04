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
        if (this.data.style !== ButtonStyle.Link) {
            const customId = `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join('-').toLowerCase()}`;
            if (customId.length > 100) {
                throw new Error(`Custom ID exceeds 100 characters: ${customId}`);
            }
            this.setCustomId(customId);
        }

        this.setStyle(ButtonStyle.Primary);
        this.setDisabled(false);
    }
}

/**
 * A builder class for creating Gargoyle buttons with specific commands and arguments.
 * Extends the `ButtonBuilder` class.
 *
 * @class
 * @extends ButtonBuilder
 */
class GargoyleURLButtonBuilder extends ButtonBuilder {
    /**
     * Creates an instance of GargoyleButtonBuilder.
     *
     * @constructor
     * @param {string} argument - The argument to be used for the button label and custom ID.
     */
    constructor(url: string) {
        super();
        this.setURL(url);
        this.setStyle(ButtonStyle.Link);
        this.setDisabled(false);
    }
}

export { GargoyleURLButtonBuilder };
export default GargoyleButtonBuilder;
