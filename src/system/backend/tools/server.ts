import { Guild, MessageCreateOptions, MessageResolvable, TextBasedChannel, TextChannel, WebhookMessageEditOptions } from 'discord.js';
import GargoyleClient from '../classes/gargoyleClient.js';
import client from '@src/system/botClient.js';

export function sendAsServer(client: GargoyleClient, message: MessageCreateOptions, channel: TextBasedChannel, guild?: Guild): Promise<void> {
    const target = channel.isThread() ? channel.parent : channel;
    if (target && !target.isDMBased())
        return target
            .fetchWebhooks()
            .then(async (webhooks) => {
                let webhook;

                webhook = webhooks.find((webhook) => webhook.owner && webhook.owner.id === client.user?.id);

                if (!webhook) {
                    webhook = await target.createWebhook({
                        name: sanitizeNameString(guild ? guild.name : target.guild?.name || target.client.user.username),
                        reason: 'Server Message'
                    });
                }

                await webhook.send({
                    avatarURL: guild ? guild.iconURL() || undefined : target.guild?.iconURL() || undefined,
                    username: sanitizeNameString(guild ? guild.name : target.guild?.name || target.client.user.username),
                    threadId: channel.isThread() ? channel.id : undefined,
                    ...message
                });
            })
            .catch((error) => {
                client.logger.error(error.stack);
            });
    return Promise.resolve();
}

export function editAsServer(message: MessageCreateOptions, channel: TextChannel, messageId: string | MessageResolvable): Promise<boolean> {
    return channel
        .fetchWebhooks()
        .then(async (webhooks) => {
            let webhook;

            webhook = webhooks.find((webhook) => webhook.owner && webhook.owner.id === channel.client.user?.id);

            if (!webhook) {
                webhook = await channel.createWebhook({
                    name: sanitizeNameString(channel.guild ? channel.guild.name : channel.client.user.username),
                    reason: 'Server Message'
                });
            }

            let messageEdit: MessageResolvable;

            if (typeof messageId === 'string') {
                messageEdit = await channel.messages.fetch(messageId);
            } else {
                messageEdit = messageId;
            }

            await webhook
                ?.editMessage(messageEdit, message as WebhookMessageEditOptions)
                .then(() => {
                    return true;
                })
                .catch((err) => {
                    client.logger.error(err);
                    return false;
                });
            return false;
        })
        .catch((err) => {
            client.logger.error(err);
            return false;
        });
}

function sanitizeNameString(str: string): string {
    return str.replaceAll(/discord/gi, 'DC');
}
