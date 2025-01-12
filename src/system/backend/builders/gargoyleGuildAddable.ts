class GargoyleGuildAddable {
    private _guilds: string[] = [];

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

    get guilds(): string[] {
        return this._guilds;
    }
}

export default GargoyleGuildAddable;
