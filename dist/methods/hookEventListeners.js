"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookEventListeners = void 0;
function hookEventListeners(dbi) {
    async function handle(eventName, ...args) {
        if (!dbi.data.eventMap[eventName])
            return;
        let ctxArgs = dbi.data.eventMap[eventName]
            .reduce((all, current, index) => {
            all[current] = args[index];
            return all;
        }, {});
        let other = {};
        if (!await dbi.events.trigger("beforeEvent", { eventName, ...ctxArgs, other }))
            return;
        for (let i = 0; i < dbi.data.events.size; i++) {
            const value = dbi.data.events.at(i);
            if (value.name == eventName) {
                await value.onExecute({ eventName, ...ctxArgs, other });
            }
        }
        dbi.events.trigger("afterEvent", { eventName, ...ctxArgs, other });
    }
    let originalEmit = dbi.client.emit;
    dbi.client.emit = function (eventName, ...args) {
        handle(eventName, ...args);
        return originalEmit.call(this, eventName, ...args);
    };
    return () => {
        dbi.client.emit = originalEmit;
    };
}
exports.hookEventListeners = hookEventListeners;
//# sourceMappingURL=hookEventListeners.js.map