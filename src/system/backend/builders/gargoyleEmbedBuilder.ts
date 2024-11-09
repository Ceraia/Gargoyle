import { EmbedBuilder } from 'discord.js';

/**
 * A specialized builder class for creating embed messages with a default color.
 * Extends the `EmbedBuilder` class.
 *
 * @remarks
 * This class sets a default embed color to `0x2b2d31` upon instantiation.
 *
 * @example
 * ```typescript
 * const embedBuilder = new GargoyleEmbedBuilder();
 * embedBuilder.setTitle("Example Title");
 * embedBuilder.setDescription("This is an example description.");
 * ```
 */
class GargoyleEmbedBuilder extends EmbedBuilder {
    constructor() {
        super();
        this.setColor(0x2b2d31); // Default embed color
    }
}

export default GargoyleEmbedBuilder;
