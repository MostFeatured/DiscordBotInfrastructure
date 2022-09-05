"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishInteractions = void 0;
const tslib_1 = require("tslib");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const permissions_1 = require("../utils/permissions");
const snakecase_keys_1 = tslib_1.__importDefault(require("snakecase-keys"));
const PUBLISHABLE_TYPES = ["ChatInput", "UserContextMenu", "MessageContextMenu"];
async function publishInteractions(clientToken, interactions, publishType, guildId) {
    interactions = interactions.filter(i => PUBLISHABLE_TYPES.includes(i.type));
    const rest = new rest_1.REST({ version: "9" });
    rest.setToken(clientToken);
    const me = await rest.get(v9_1.Routes.user());
    const body = interactions.reduce((all, current) => {
        switch (current.type) {
            case "ChatInput": {
                let nameSplitted = current.name.split(" ");
                switch (nameSplitted.length) {
                    case 1: {
                        all.push({
                            type: v9_1.ApplicationCommandType.ChatInput,
                            description: current.description,
                            name: nameSplitted[0],
                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                            dm_permission: current.directMessages,
                            options: (0, snakecase_keys_1.default)(current.options || [])
                        });
                        break;
                    }
                    case 2: {
                        let baseItem = all.find(i => i.name == current.name.split(" ")[0] && i.type == "ChatInput");
                        let option = {
                            type: v9_1.ApplicationCommandOptionType.Subcommand,
                            name: nameSplitted[1],
                            description: current.description,
                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                            dm_permission: current.directMessages,
                            options: (0, snakecase_keys_1.default)(current.options || [])
                        };
                        if (!baseItem) {
                            all.push({
                                type: v9_1.ApplicationCommandType.ChatInput,
                                name: nameSplitted[0],
                                description: "...",
                                options: [
                                    option
                                ]
                            });
                        }
                        else {
                            baseItem.options.push(option);
                        }
                        break;
                    }
                    case 3: {
                        let level1Item = all.find(i => i.name == current.name.split(" ")[0] && i.type == "ChatInput");
                        if (!level1Item) {
                            all.push({
                                type: v9_1.ApplicationCommandType.ChatInput,
                                name: nameSplitted[0],
                                description: "...",
                                options: [
                                    {
                                        type: v9_1.ApplicationCommandOptionType.SubcommandGroup,
                                        name: nameSplitted[1],
                                        description: "...",
                                        options: [
                                            {
                                                type: v9_1.ApplicationCommandOptionType.Subcommand,
                                                name: nameSplitted[2],
                                                description: current.description,
                                                default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                                                dm_permission: current.directMessages,
                                                options: (0, snakecase_keys_1.default)(current.options || [])
                                            }
                                        ]
                                    }
                                ]
                            });
                        }
                        else {
                            let level2Item = level1Item.options.find(i => i.name == current.name.split(" ")[1] && i.type == "ChatInput");
                            if (!level2Item) {
                                level1Item.options.push({
                                    type: v9_1.ApplicationCommandOptionType.SubcommandGroup,
                                    name: nameSplitted[1],
                                    description: "...",
                                    options: [
                                        {
                                            type: v9_1.ApplicationCommandOptionType.Subcommand,
                                            name: nameSplitted[2],
                                            description: current.description,
                                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                                            dm_permission: current.directMessages,
                                            options: (0, snakecase_keys_1.default)(current.options || [])
                                        }
                                    ]
                                });
                            }
                            else {
                                level2Item.options.push({
                                    type: v9_1.ApplicationCommandOptionType.Subcommand,
                                    name: nameSplitted[2],
                                    description: current.description,
                                    default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                                    dm_permission: current.directMessages,
                                    options: (0, snakecase_keys_1.default)(current.options || [])
                                });
                            }
                        }
                        break;
                    }
                }
                break;
            }
            case "MessageContextMenu": {
                all.push({
                    type: v9_1.ApplicationCommandType.Message,
                    name: current.name,
                    default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                    dm_permission: current.directMessages
                });
                break;
            }
            case "UserContextMenu": {
                all.push({
                    type: v9_1.ApplicationCommandType.User,
                    name: current.name,
                    default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                    dm_permission: current.directMessages
                });
                break;
            }
        }
        return all;
    }, []);
    switch (publishType) {
        case "Global": {
            await rest.put(v9_1.Routes.applicationGuildCommands(me.id, guildId), { body });
            break;
        }
        case "Guild": {
            await rest.put(v9_1.Routes.applicationCommands(me.id), { body });
            break;
        }
    }
}
exports.publishInteractions = publishInteractions;
//# sourceMappingURL=publishInteractions.js.map