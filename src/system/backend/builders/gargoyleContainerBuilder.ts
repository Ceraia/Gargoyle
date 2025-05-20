import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';

/**
 * A helper builder class for discord containers to easily add text
 *
 * @class
 * @extends ContainerBuilder
 */
class GargoyleContainerBuilder extends ContainerBuilder {
    /**
     * Creates an instance of GargoyleContainerBuilder
     *
     * @constructor
     * @param {string[]} messages - Messages to automagically add to the container for shorthand access
     */
    constructor(...messages: string[]) {
        super();
        if (messages.length > 0) {
            for (const message of messages) {
                this.addTextDisplayComponents(new TextDisplayBuilder().setContent(message));
            }
        }
    }
}

export default GargoyleContainerBuilder;
