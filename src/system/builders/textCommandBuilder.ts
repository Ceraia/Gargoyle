class TextCommandBuilder {
    private _name: string | undefined;
    private _description: string | undefined;
    private _aliases: string[] = [];

    setName(name: string): this {
        if (!name || typeof name !== 'string') {
            throw new Error('Name must be a non-empty string.');
        }
        this._name = name;
        return this;
    }

    setDescription(description: string): this {
        if (!description || typeof description !== 'string') {
            throw new Error('Description must be a non-empty string.');
        }
        this._description = description;
        return this;
    }

    addAlias(alias: string): this {
        if (!alias || typeof alias !== 'string') {
            throw new Error('Alias must be a non-empty string.');
        }
        this._aliases.push(alias);
        return this;
    }

    get name(): string {
        if (!this._name) {
            throw new Error('Command name has not been set.');
        }
        return this._name;
    }

    get description(): string {
        if (!this._description) {
            throw new Error('Command description has not been set.');
        }
        return this._description;
    }

    get aliases(): string[] {
        return this._aliases;
    }

    build(): { name: string; description: string; aliases: string[] } {
        if (!this._name || !this._description) {
            throw new Error('Command must have a name and description.');
        }
        return {
            name: this._name,
            description: this._description,
            aliases: this._aliases
        };
    }
}

export default TextCommandBuilder;
