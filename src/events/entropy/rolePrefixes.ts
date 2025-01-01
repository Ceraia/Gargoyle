import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, GuildMember } from 'discord.js';

export default class RolePrefix extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;

    public async execute(client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1009048008857493624') return;

        client.logger.debug(`Updating nickname for ${member.user.tag}`);

        const updatedMember = await member.fetch(true);
        let namePrefix = '[';

        updatedMember.roles.cache.forEach((role) => {
            if (role.name === '@everyone') return;
            namePrefix += role.name.split('')[0].toUpperCase();
        });

        namePrefix += `] ${updatedMember.nickname?.split(' ').slice(1).join(' ') || updatedMember.user.username}`;

        updatedMember.setNickname(namePrefix).catch(() => { });
    }
}
