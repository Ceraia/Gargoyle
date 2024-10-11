import { Schema, model } from 'mongoose';

const guildUserSchema = new Schema({
    userId: String,
    guildId: String,
    economy: {
        balance: {
            type: Number,
            default: 0
        },
        experience: {
            type: Number,
            default: 0
        }
    }
});

const databaseGuildUsers = model('GuildUser', guildUserSchema);

async function getGuildUser(userId: string, guildId: string) {
    let databaseGuildUser = await databaseGuildUsers.findOne({
        userId,
        guildId
    });
    if (!databaseGuildUser) {
        databaseGuildUser = new databaseGuildUsers({
            userId,
            guildId
        });
        await databaseGuildUser.save();
    }
    return databaseGuildUser;
}

export { databaseGuildUsers, getGuildUser };