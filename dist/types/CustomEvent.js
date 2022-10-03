"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBICustomEvent = void 0;
class DBICustomEvent {
    dbi;
    name;
    map;
    type;
    trigger(args) {
        return this.dbi.client.emit(this.name, { ...args, direct: true });
    }
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.name = cfg.name;
        this.map = cfg.map;
        this.type = "CustomEvent";
    }
}
exports.DBICustomEvent = DBICustomEvent;
//# sourceMappingURL=CustomEvent.js.map