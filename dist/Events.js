"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
class Events {
    DBI;
    handlers;
    constructor(DBI) {
        this.DBI = DBI;
        this.handlers = {
            beforeInteraction: [],
            afterInteraction: [],
            interactionRateLimit: [],
            beforeEvent: [],
            afterEvent: [],
            interactionError: [],
            eventError: []
        };
    }
    async trigger(name, data) {
        let handlers = this.handlers[name];
        if (!handlers)
            return true;
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            let returned = await handler(data);
            if (returned !== true)
                return false;
        }
        return true;
    }
    on(eventName, handler, options = { once: false }) {
        if (!this.handlers.hasOwnProperty(eventName))
            this.handlers[eventName] = [];
        if (options.once) {
            let h = (data) => {
                this.off(eventName, h);
                return handler(data);
            };
            this.on(eventName, h, { once: false });
            return () => {
                this.off(eventName, h);
            };
        }
        else {
            this.handlers[eventName].push(handler);
            return () => {
                this.off(eventName, handler);
            };
        }
    }
    off(eventName, handler) {
        let l = this.handlers[eventName];
        if (!l)
            return [];
        return l.splice(l.indexOf(handler), 1);
    }
}
exports.Events = Events;
//# sourceMappingURL=Events.js.map