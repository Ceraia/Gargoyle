import { SlashCommandBuilder } from 'discord.js';

/**
 * A builder class for creating Gargoyle buttons with specific commands and arguments.
 * Extends the `ButtonBuilder` class.
 *
 * @class
 * @extends ButtonBuilder
 */
class GargoyleSlashCommandBuilder extends SlashCommandBuilder {
    private _guilds: string[] = [];
    private _private: boolean = false;
    /**
     * Creates an instance of GargoyleSlashCommandBuilder.
     * @constructor
     */
    constructor() {
        super();
    }

    addGuild(guild: string): this {
        if (!guild || typeof guild !== 'string') {
            throw new Error('Guild must be a non-empty string.');
        }
        this._guilds.push(guild);
        return this;
    }

    addGuilds(...guilds: string[]): this {
        if (!guilds) {
            throw new Error('Guilds must be a non-empty string list.');
        }
        guilds.forEach((guild) => this._guilds.push(guild));
        return this;
    }

    setPrivate(priv: boolean = true): this {
        this._private = priv;
        return this;
    }

    get private(): boolean {
        return this._private;
    }

    get guilds(): string[] {
        return this._guilds;
    }
}

export default GargoyleSlashCommandBuilder;
