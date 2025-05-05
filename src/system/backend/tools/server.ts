import { Guild, MessageCreateOptions, MessageResolvable, TextChannel, WebhookMessageEditOptions } from 'discord.js';
import GargoyleClient from '../classes/gargoyleClient.js';

export function sendAsServer(client: GargoyleClient, message: MessageCreateOptions, channel: TextChannel, guild?: Guild): Promise<void> {
    return channel
        .fetchWebhooks()
        .then(async (webhooks) => {
            let webhook;

            webhook = webhooks.find((webhook) => webhook.owner && webhook.owner.id === client.user?.id);

            if (!webhook) {
                webhook = await channel.createWebhook({
                    name: sanitizeNameString(guild ? guild.name : channel.guild?.name || channel.client.user.username),
                    reason: 'Server Message'
                });
            }

            client.logger.trace(JSON.stringify(webhook));

            await webhook.send({
                avatarURL: guild ? guild.iconURL() || undefined : channel.guild?.iconURL() || undefined,
                username: sanitizeNameString(guild ? guild.name : channel.guild?.name || channel.client.user.username),
                ...message
            });
        })
        .catch((error) => {
            client.logger.error(error.stack);
        });
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
                .catch(() => {
                    return false;
                });
            return false;
        })
        .catch(() => {
            return false;
        });
}

function sanitizeNameString(str: string): string {
    return str.replaceAll(/discord/gi, 'DC');
}