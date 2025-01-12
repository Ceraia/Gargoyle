import { InteractionContextType } from "discord.js";

/**
 * A builder class for creating text commands with a name, description, and aliases.
 *
 * @class TextCommandBuilder
 *
 * @example
 * ```typescript
 * const command = new TextCommandBuilder()
 *     .setName('example')
 *     .setDescription('This is an example command')
 *     .addAlias('ex')
 *     .addAlias('sample');
 *
 * console.log(command.name); // 'example'
 * console.log(command.description); // 'This is an example command'
 * console.log(command.aliases); // ['ex', 'sample']
 * ```
 *
 * @method setName
 * @param {string} name - The name of the command. Must be a non-empty string.
 * @returns {this} The instance of the builder for chaining.
 * @throws {Error} If the name is not a non-empty string.
 *
 * @method setDescription
 * @param {string} description - The description of the command. Must be a non-empty string.
 * @returns {this} The instance of the builder for chaining.
 * @throws {Error} If the description is not a non-empty string.
 *
 * @method addAlias
 * @param {string} alias - An alias for the command. Must be a non-empty string.
 * @returns {this} The instance of the builder for chaining.
 * @throws {Error} If the alias is not a non-empty string.
 *
 * @property {string} name - The name of the command. Throws an error if not set.
 * @property {string} description - The description of the command. Throws an error if not set.
 * @property {string[]} aliases - The list of aliases for the command.
 */
class GargoyleTextCommandBuilder {
    private _name: string | undefined;
    private _description: string | undefined;
    private _aliases: string[] = [];
    private _contexts: InteractionContextType[] = [];
    private _guilds: string[] = [];

    setName(name: string): this {
        if (!name || typeof name !== "string") {
            throw new Error("Name must be a non-empty string.");
        }
        this._name = name;
        return this;
    }

    setDescription(description: string): this {
        if (!description || typeof description !== "string") {
            throw new Error("Description must be a non-empty string.");
        }
        this._description = description;
        return this;
    }

    addAlias(alias: string): this {
        if (!alias || typeof alias !== "string") {
            throw new Error("Alias must be a non-empty string.");
        }
        this._aliases.push(alias);
        return this;
    }

    addGuild(guild: string): this {
        if (!guild || typeof guild !== "string") {
            throw new Error("Guild must be a non-empty string.");
        }
        this._guilds.push(guild);
        return this;
    }

    addGuilds(...guilds: string[]): this {
        if (!guilds) {
            throw new Error("Guilds must be a non-empty string list.");
        }
        guilds.forEach((guild) => this._guilds.push(guild));
        return this;
    }

    setContexts(contexts: InteractionContextType[]): this {
        this._contexts = contexts;
        return this;
    }

    get name(): string {
        if (!this._name) {
            throw new Error("Command name has not been set.");
        }
        return this._name;
    }

    get description(): string {
        if (!this._description) {
            throw new Error("Command description has not been set.");
        }
        return this._description;
    }

    get aliases(): string[] {
        return this._aliases;
    }

    get guilds(): string[] {
        return this._guilds;
    }

    get contexts(): InteractionContextType[] {
        return this._contexts;
    }
}

export default GargoyleTextCommandBuilder;
