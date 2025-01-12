import { ModalBuilder } from "discord.js";
import GargoyleCommand from "../classes/gargoyleCommand.js";

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
     * @param {GargoyleCommand} command - The command associated with the modal.
     * @param {string} argument - The argument to be used and referenced for execution in the command.
     */
    constructor(command: GargoyleCommand, ...argument: string[]) {
        super();
        this.setCustomId(
            `cmd-${
                command.slashCommand?.name.toLowerCase() ??
                command.textCommand?.name.toLowerCase() ??
                command.slashCommands[0].name.toLowerCase() ??
                command.textCommands[0].name.toLowerCase()
            }-${argument.join("-").toLowerCase()}`
        );
    }
}

export default GargoyleModalBuilder;
