import {
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder
} from 'discord.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

class GargoyleStringSelectMenuBuilder extends StringSelectMenuBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`cmd-${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
    }
}

class GargoyleUserSelectMenuBuilder extends UserSelectMenuBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`cmd-${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
    }
}

class GargoyleRoleSelectMenuBuilder extends RoleSelectMenuBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`cmd-${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
    }
}

class GargoyleMentionableSelectMenuBuilder extends MentionableSelectMenuBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`cmd-${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
    }
}

class GargoyleChannelSelectMenuBuilder extends ChannelSelectMenuBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`cmd-${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
    }
}

export {
    GargoyleStringSelectMenuBuilder,
    GargoyleUserSelectMenuBuilder,
    GargoyleRoleSelectMenuBuilder,
    GargoyleMentionableSelectMenuBuilder,
    GargoyleChannelSelectMenuBuilder
};
