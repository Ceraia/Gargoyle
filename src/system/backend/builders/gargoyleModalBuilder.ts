import { ModalBuilder } from 'discord.js';
import GargoyleModule from '../classes/gargoyleModule.js';

/**
 * A builder class for creating custom modals specific to Gargoyle commands.
 * Extends the `ModalBuilder` class.
 *
 * @class
 * @extends {ModalBuilder}
 */
class GargoyleModalBuilder extends ModalBuilder {
    /**
     * Creates an instance of GargoyleModalBuilder.
     *
     * @constructor
     * @param {GargoyleModule} command - The command associated with the modal.
     * @param {string} argument - The argument to be used and referenced for execution in the command.
     */
    constructor(command: GargoyleModule, ...argument: string[]) {
        super();

        const customId = `cmd-${
            command.slashCommands[0].name.toLowerCase() ?? command.textCommands[0].name.toLowerCase()
        }-${argument.join('-').toLowerCase()}`;
        if (customId.length > 100) {
            throw new Error(`Custom ID exceeds 100 characters: ${customId}`);
        }
        this.setCustomId(customId);
    }
}

export default GargoyleModalBuilder;
