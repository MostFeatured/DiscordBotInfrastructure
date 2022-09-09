"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLocale = exports.localeifyOptions = exports.publishInteractions = void 0;
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const permissions_1 = require("../utils/permissions");
const PUBLISHABLE_TYPES = ["ChatInput", "UserContextMenu", "MessageContextMenu"];
const ORIGINAL_LOCALES = ["da", "de", "en-GB", "en-US", "es-ES", "fr", "hr", "it", "lt", "hu", "nl", "no", "pl", "pt-BR", "ro", "fi", "sv-SE", "vi", "tr", "cs", "el", "bg", "ru", "uk", "hi", "th", "zh-CN", "ja", "zh-TW", "ko"];
async function publishInteractions(clientToken, interactions, interactionsLocales, publishType, guildId) {
    interactions = interactions.filter(i => PUBLISHABLE_TYPES.includes(i.type));
    const rest = new rest_1.REST({ version: "9" });
    rest.setToken(clientToken);
    const me = await rest.get(v9_1.Routes.user());
    interactions = interactions.sort((a, b) => b.name.split(" ").length - a.name.split(" ").length);
    let body = interactions.reduce((all, current) => {
        switch (current.type) {
            case "ChatInput": {
                let nameSplitted = current.name.split(" ");
                let localeData = formatLocale(interactionsLocales.get(current.name) ?? {});
                switch (nameSplitted.length) {
                    case 1: {
                        all.push({
                            type: v9_1.ApplicationCommandType.ChatInput,
                            description: current.description,
                            name: nameSplitted[0],
                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                            dm_permission: current.directMessages,
                            options: localeifyOptions(current.options || [], localeData.optionsLocales),
                            name_localizations: localeData.nameLocales(0),
                            description_localizations: localeData.descriptionLocales,
                        });
                        break;
                    }
                    case 2: {
                        let baseItem = all.find(i => i.name == current.name.split(" ")[0] && i.type == v9_1.ApplicationCommandType.ChatInput);
                        let localeData = formatLocale(interactionsLocales.get(current.name) ?? {});
                        let option = {
                            type: v9_1.ApplicationCommandOptionType.Subcommand,
                            name: nameSplitted[1],
                            description: current.description,
                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                            dm_permission: current.directMessages,
                            options: localeifyOptions(current.options || [], localeData.optionsLocales),
                            name_localizations: localeData.nameLocales(1),
                            description_localizations: localeData.descriptionLocales,
                        };
                        if (!baseItem) {
                            all.push({
                                type: v9_1.ApplicationCommandType.ChatInput,
                                name: nameSplitted[0],
                                name_localizations: localeData.nameLocales(0),
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
                        let level1Item = all.find(i => i.name == current.name.split(" ")[0] && i.type == v9_1.ApplicationCommandType.ChatInput);
                        let localeData = formatLocale(interactionsLocales.get(current.name) ?? {});
                        if (!level1Item) {
                            all.push({
                                type: v9_1.ApplicationCommandType.ChatInput,
                                name: nameSplitted[0],
                                name_localizations: localeData.nameLocales(0),
                                description: "...",
                                options: [
                                    {
                                        type: v9_1.ApplicationCommandOptionType.SubcommandGroup,
                                        name: nameSplitted[1],
                                        name_localizations: localeData.nameLocales(1),
                                        description: "...",
                                        options: [
                                            {
                                                type: v9_1.ApplicationCommandOptionType.Subcommand,
                                                name: nameSplitted[2],
                                                description: current.description,
                                                default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                                                dm_permission: current.directMessages,
                                                options: localeifyOptions(current.options || [], localeData.optionsLocales),
                                                name_localizations: localeData.nameLocales(2),
                                                description_localizations: localeData.descriptionLocales,
                                            }
                                        ]
                                    }
                                ]
                            });
                        }
                        else {
                            let level2Item = level1Item.options.find(i => i.name == current.name.split(" ")[1]);
                            if (!level2Item) {
                                level1Item.options.push({
                                    type: v9_1.ApplicationCommandOptionType.SubcommandGroup,
                                    name: nameSplitted[1],
                                    name_localizations: localeData.nameLocales(1),
                                    description: "...",
                                    options: [
                                        {
                                            type: v9_1.ApplicationCommandOptionType.Subcommand,
                                            name: nameSplitted[2],
                                            description: current.description,
                                            default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                                            dm_permission: current.directMessages,
                                            options: localeifyOptions(current.options || [], localeData.optionsLocales),
                                            name_localizations: localeData.nameLocales(2),
                                            description_localizations: localeData.descriptionLocales
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
                                    options: localeifyOptions(current.options || [], localeData.optionsLocales),
                                    name_localizations: localeData.nameLocales(2),
                                    description_localizations: localeData.descriptionLocales,
                                });
                            }
                        }
                        break;
                    }
                }
                break;
            }
            case "MessageContextMenu": {
                let localeData = formatLocale(interactionsLocales.get(current.name) ?? {});
                all.push({
                    type: v9_1.ApplicationCommandType.Message,
                    name: current.name,
                    default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                    dm_permission: current.directMessages,
                    name_localizations: localeData.allNameLocales,
                    description_localizations: localeData.descriptionLocales,
                });
                break;
            }
            case "UserContextMenu": {
                let localeData = formatLocale(interactionsLocales.get(current.name) ?? {});
                all.push({
                    type: v9_1.ApplicationCommandType.User,
                    name: current.name,
                    default_member_permissions: (0, permissions_1.reducePermissions)(current.defaultMemberPermissions).toString(),
                    dm_permission: current.directMessages,
                    name_localizations: localeData.allNameLocales,
                    description_localizations: localeData.descriptionLocales
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
function localeifyOptions(options, localeData) {
    return options.map(i => {
        let optionData = localeData[i.name];
        return optionData ? Object.assign(i, {
            name_localizations: optionData.nameLocales,
            description_localizations: optionData.descriptionLocales,
            choices: i.choices ? i.choices.map((j) => {
                let choiceLocale = optionData.choiceLocales[j.name];
                return choiceLocale ? Object.assign(j, {
                    name_localizations: choiceLocale
                }) : j;
            }) : undefined
        }) : i;
    });
}
exports.localeifyOptions = localeifyOptions;
function formatLocale(locale) {
    let allNameLocales = {};
    let descriptionLocales = {};
    let optionsLocales = {};
    function nameLocales(index) {
        return Object.fromEntries(Object.entries(allNameLocales).map(i => [i[0], i[1].split(" ").at(index)]));
    }
    if (!locale?.data)
        return {
            nameLocales,
            allNameLocales,
            descriptionLocales,
            optionsLocales
        };
    Object.entries(locale.data).forEach(([shortLocale, localeData]) => {
        let longAliases = ORIGINAL_LOCALES.filter(i => i.split("-").at(0) == shortLocale);
        longAliases.forEach((longLocale) => {
            allNameLocales[longLocale] = localeData.name;
            descriptionLocales[longLocale] = localeData.description;
            Object.entries(localeData.options || []).forEach(([optionName, optionData]) => {
                if (!optionsLocales[optionName])
                    optionsLocales[optionName] = {};
                let optionLocale = optionsLocales[optionName];
                if (!optionLocale.nameLocales)
                    optionLocale.nameLocales = {};
                if (!optionLocale.descriptionLocales)
                    optionLocale.descriptionLocales = {};
                if (!optionLocale.choiceLocales)
                    optionLocale.choiceLocales = {};
                Object.entries(optionData.choices).forEach(([choiceOriginalName, choiceName]) => {
                    if (!optionLocale.choiceLocales)
                        optionLocale.choiceLocales = {};
                    if (!optionLocale.choiceLocales[choiceOriginalName])
                        optionLocale.choiceLocales[choiceOriginalName] = {};
                    let choiceLocale = optionLocale.choiceLocales[choiceOriginalName];
                    choiceLocale[longLocale] = choiceName;
                });
                optionLocale.nameLocales[longLocale] = optionData.name;
                optionLocale.descriptionLocales[longLocale] = optionData.description;
            });
        });
    });
    return {
        nameLocales,
        allNameLocales,
        descriptionLocales,
        optionsLocales
    };
}
exports.formatLocale = formatLocale;
//# sourceMappingURL=publishInteractions.js.map