"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookEventListeners = void 0;
const discord_js_1 = require("discord.js");
function hookEventListeners(dbi) {
    function getClientByEvent(value) {
        return value.triggerType == "OneByOne"
            ? dbi.data.clients.next(`Event:${value.id}`)
            : value.triggerType == "OneByOneGlobal"
                ? dbi.data.clients.next("Event")
                : value.triggerType == "Random"
                    ? dbi.data.clients.random()
                    : dbi.data.clients.first();
    }
    async function handle(eventName, ...args) {
        if (!dbi.data.eventMap[eventName])
            return;
        let isDirect = args?.[0]?._DIRECT_ ?? false;
        if (isDirect)
            delete args[0]._DIRECT_;
        let ctxArgs = isDirect
            ? args[0]
            : dbi.data.eventMap[eventName].reduce((all, current, index) => {
                all[current] = args[index];
                return all;
            }, {});
        let other = {};
        let guildLocaleName = args.reduce((all, current) => {
            if (current?.guild?.id)
                return current?.guild?.preferredLocale?.split?.("-")?.[0];
            if (current instanceof discord_js_1.Guild)
                return current?.preferredLocale?.split?.("-")?.[0];
            return all;
        }, null);
        let guildLocale = guildLocaleName ? (dbi.data.locales.has(guildLocaleName) ? dbi.data.locales.get(guildLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale)) : null;
        let locale = guildLocale ? { guild: guildLocale } : null;
        if (!await dbi.events.trigger("beforeEvent", { eventName, ...ctxArgs, other, locale }))
            return;
        let ordered = [];
        let unOrdered = [];
        for (let i = 0; i < dbi.data.events.size; i++) {
            const value = dbi.data.events.at(i);
            if (value.name == eventName) {
                if (value.ordered) {
                    ordered.push(value);
                }
                else {
                    unOrdered.push(value);
                }
            }
        }
        let arg = { eventName, ...ctxArgs, other, locale };
        for (let i = 0; i < unOrdered.length; i++) {
            const value = unOrdered[i];
            if (value?.disabled)
                continue;
            if (dbi.config.strict) {
                value.onExecute({ ...arg, nextClient: getClientByEvent(value) });
            }
            else {
                try {
                    value.onExecute({ ...arg, nextClient: getClientByEvent(value) })?.catch(error => {
                        dbi.events.trigger("eventError", Object.assign(arg, { error }));
                    });
                }
                catch (error) {
                    dbi.events.trigger("eventError", Object.assign(arg, { error }));
                }
            }
        }
        for (let i = 0; i < ordered.length; i++) {
            const value = ordered[i];
            if (value?.disabled)
                continue;
            if (dbi.config.strict) {
                await value.onExecute({ ...arg, nextClient: getClientByEvent(value) });
            }
            else {
                try {
                    await value.onExecute({ ...arg, nextClient: getClientByEvent(value) })?.catch(error => {
                        dbi.events.trigger("eventError", Object.assign(arg, { error }));
                    });
                }
                catch (error) {
                    await dbi.events.trigger("eventError", Object.assign(arg, { error }));
                }
            }
        }
        dbi.events.trigger("afterEvent", arg);
    }
    let firstClient = dbi.data.clients.first().client;
    let originalEmit = firstClient.emit;
    firstClient.emit = function (eventName, ...args) {
        handle(eventName, ...args);
        return originalEmit.call(this, eventName, ...args);
    };
    return () => {
        firstClient.emit = originalEmit;
    };
}
exports.hookEventListeners = hookEventListeners;
//# sourceMappingURL=hookEventListeners.js.map