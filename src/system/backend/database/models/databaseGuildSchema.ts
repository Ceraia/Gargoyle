import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
    guildId: String,
    prefix: {
        type: String,
        default: ','
    },
    dynamicVCs: {
        prefix: {
            type: String,
            default: ''
        }
    },
    autoRoles: {
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
