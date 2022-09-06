"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookInteractionListeners = void 0;
const customId_1 = require("../utils/customId");
function hookInteractionListeners(dbi) {
    async function handle(inter) {
        const dbiInter = dbi.data.interactions.find(i => {
            let isUsesCustomId = (inter.isButton() || inter.isSelectMenu() || inter.isModalSubmit());
            let parsedId = isUsesCustomId ? (0, customId_1.parseCustomId)(dbi, inter.customId) : null;
            return ((i.type == "ChatInput"
                && (inter.isChatInputCommand() || inter.isAutocomplete())
                && i.name == [inter.commandName, inter.options.getSubcommandGroup(false), inter.options.getSubcommand(false)].filter(i => !!i).join(" "))
                ||
                    ((i.type == "MessageContextMenu" || i.type == "UserContextMenu")
                        && (inter.isMessageContextMenuCommand() || inter.isUserContextMenuCommand())
                        && inter.commandName == i.name)
                ||
                    ((i.type == "Button" || i.type == "SelectMenu" || i.type == "Modal")
                        && isUsesCustomId
                        && parsedId?.name == i.name));
        });
        if (!dbiInter)
            return;
        if (inter.isAutocomplete()) {
            let focussed = inter.options.getFocused(true);
            let option = dbiInter.options.find(i => i.name == focussed.name);
            if (option?.onComplete) {
                let response = await option.onComplete({
                    value: focussed.value,
                    interaction: inter,
                    dbi
                });
                await inter.respond(response);
            }
            return;
        }
        let userLocaleName = inter.locale.split("-")[0];
        let userLocale = userLocaleName ? dbi.data.locales.get(userLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale);
        let guildLocaleName = inter.guild ? inter.guild.preferredLocale.split("-")[0] : null;
        let guildLocale = guildLocaleName ? (dbi.data.locales.has(guildLocaleName) ? dbi.data.locales.get(guildLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale)) : null;
        let locale = {
            user: userLocale,
            guild: guildLocale
        };
        let data = (inter.isButton() || inter.isSelectMenu() || inter.isModalSubmit()) ? (0, customId_1.parseCustomId)(dbi, inter.customId).data : undefined;
        let rateLimitKeyMap = {
            "User": `${inter.user.id}`,
            "Channel": `${inter.channelId || "Channel"}`,
            "Guild": `${inter.guildId || "Guild"}`,
            "Member": `${inter.user.id}_${inter.guildId || "Guild"}`,
            "Message": `${inter?.message?.id}`
        };
        for (const type in rateLimitKeyMap) {
            // @ts-ignore
            let key = `RateLimit["${rateLimitKeyMap[type]}"]`;
            let val = await dbi.config.store.get(key);
            if (val && Date.now() > val.at + val.duration) {
                await dbi.config.store.del(key);
                val = null;
            }
            if (val) {
                dbi.events.trigger("interactionRateLimit", {
                    dbi,
                    interaction: inter,
                    locale,
                    data,
                    rateLimit: {
                        type: key,
                        ...val
                    }
                });
                return;
            }
        }
        async function setRateLimit(type, duration) {
            // @ts-ignore
            await dbi.config.store.set(`RateLimit["${rateLimitKeyMap[type]}"]`, { at: Date.now(), duration });
        }
        let other = {};
        if (!(await dbi.events.trigger("beforeInteraction", { dbi, interaction: inter, locale, setRateLimit, data, other })))
            return;
        await dbiInter.onExecute({
            dbi,
            // @ts-ignore
            interaction: inter,
            // @ts-ignore
            locale,
            setRateLimit,
            // @ts-ignore
            data,
            other
        });
        dbi.events.trigger("afterInteraction", { dbi, interaction: inter, locale, setRateLimit, data, other });
    }
    dbi.client.on("interactionCreate", handle);
    return () => {
        dbi.client.off("interactionCreate", handle);
    };
}
exports.hookInteractionListeners = hookInteractionListeners;
//# sourceMappingURL=hookInteractionListeners.js.map