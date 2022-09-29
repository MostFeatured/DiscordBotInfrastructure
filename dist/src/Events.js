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
            afterEvent: []
        };
    }
    async trigger(name, data) {
        let handlers = this.handlers[name];
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            let returned = await handler(data);
            if (returned !== true)
                return false;
        }
        return true;
    }
    on(eventName, handler, options = { once: false }) {
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
        l.splice(l.indexOf(handler), 1);
    }
}
exports.Events = Events;
//# sourceMappingURL=Events.js.map