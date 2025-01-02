import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, VoiceState } from 'discord.js';

export default class VoiceActivity extends GargoyleEvent {
    public event = Events.VoiceStateUpdate as const;

    public execute(client: GargoyleClient, oldState: VoiceState, newState: VoiceState): void {
        const member = oldState.member;
        if (!member || member.user.bot) return;

        const guildId = oldState.guild.id;
        const userId = member.id;

        if (client.db === null) return;

        if (newState.channelId && !oldState.channelId) {
            // User joined a voice channel
            getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                voiceTime.activity.push({
                    dateJoined: new Date(),
                    dateLastChecked: new Date(),
                    hasLeft: false
                });
                await voiceTime.save();
            }
            );
        } else {
            getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                const lastActivity = voiceTime.activity.pop();
                if (lastActivity) {
                    if (lastActivity.hasLeft) return;
                    lastActivity.dateLastChecked = new Date();
                    if (newState.channelId === null) {
                        lastActivity.hasLeft = true;
                    }
                    voiceTime.activity.push(lastActivity);
                    await voiceTime.save();
                }

                if (voiceTime.activity.length > 999) {
                    voiceTime.activity.shift();
                    await voiceTime.save();
                }

                const totalVoiceTime = await getUserVoiceActivity(userId, guildId, 1440);
                client.logger.info(`User has been in voice channels for ${totalVoiceTime}ms in the past 24 hours`);
            }
            );
        }
    }
}

import { Schema, model } from 'mongoose';

const guildUserVoiceActivitySchema = new Schema({
    userId: String,
    guildId: String,
    activity: [
        {
            dateJoined: {
                type: Date,
                default: Date.now
            },
            dateLastChecked: {
                // The last time the user's voice activity was checked, will be checked on leave but will also periodically be checked to handle edge cases
                type: Date,
                default: Date.now
            },
            hasLeft:
            {
                type: Boolean,
                default: false
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

    const currentTime = new Date();
    const timeAgo = new Date(currentTime.getTime() - time * 60000);

    let totalVoiceTime = 0;
    for (const activity of databaseGuildUser.activity) {
        if (activity.dateJoined.getTime() < timeAgo.getTime()) {
            if (!activity.hasLeft) {
                totalVoiceTime += currentTime.getTime() - activity.dateJoined.getTime();
            }
        }
    }

    return totalVoiceTime;
}

export { databaseGuildUserVoiceActivity, getGuildUserVoiceActivity, getUserVoiceActivity };
