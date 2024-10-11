import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
    guildId: String,
    prefix: {
        type: String,
        default: ','
    },
    dynamic_vcs: {
        prefix: {
            type: String,
            default: ''
        },
        overrides: {
            type: Array,
            default: []
        }
    },
    autoroles: {
        type: Array,
        default: []
    }
});

const databaseGuilds = model('Guild', guildSchema);

async function getGuild(guildId: string) {
    let databaseGuild = await databaseGuilds.findOne({ guildId });
    if (!databaseGuild) {
        databaseGuild = new databaseGuilds({ guildId });
        await databaseGuild.save();
    }
    return databaseGuild;
}

export { databaseGuilds, getGuild };