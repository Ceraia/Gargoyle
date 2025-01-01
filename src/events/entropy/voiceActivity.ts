import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, VoiceState } from 'discord.js';

export default class VoiceActivity extends GargoyleEvent {
    public event = Events.VoiceStateUpdate as const;

    public execute(client: GargoyleClient, oldState: VoiceState, newState: VoiceState): void {
        if (oldState.guild.id !== '1009048008857493624') return;

        const member = oldState.member;
        if (!member || member.user.bot) return;

        client.logger.trace(`Updating voice activity for ${newState.member?.user.tag}`);
    }
}

import { Schema, model } from 'mongoose';

const guildUserVoiceActivitySchema = new Schema({
    userId: String,
    guildId: String,
    activity: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            time: {
                type: Number,
                default: 0 // Time in minutes
            }
        }
    ]
});

const databaseGuildUserVoiceActivity = model('GuildUserVoiceActivity', guildUserVoiceActivitySchema);

async function getGuildUserVoiceActivity(userId: string, guildId: string) {
    let databaseGuildUser = await databaseGuildUserVoiceActivity.findOne({
        userId,
        guildId
    });
    if (!databaseGuildUser) {
        databaseGuildUser = new databaseGuildUserVoiceActivity({
            userId,
            guildId
        });
        await databaseGuildUser.save();
    }
    return databaseGuildUser;
}

async function getUserVoiceActivity(
    userId: string,
    guildId: string,
    time: number // The amount of time to look back in minutes
) {
    const databaseGuildUser = await getGuildUserVoiceActivity(userId, guildId);

    const currentTime = Date.now();
    const timeAgo = currentTime - time * 60000;

    let totalVoiceTime = 0;
    for (const activity of databaseGuildUser.activity) {
        if (activity.date.getTime() >= timeAgo) {
            totalVoiceTime += activity.time;
        }
    }

    return totalVoiceTime;
}

export { databaseGuildUserVoiceActivity, getGuildUserVoiceActivity, getUserVoiceActivity };
