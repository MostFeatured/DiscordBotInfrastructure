"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIEvent = void 0;
class DBIEvent {
    type;
    other;
    id;
    name;
    onExecute;
    dbi;
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.type = "Event";
        this.id = cfg.id;
        this.other = cfg.other;
        this.name = cfg.name;
        this.onExecute = cfg.onExecute;
    }
}
exports.DBIEvent = DBIEvent;
//# sourceMappingURL=Event.js.map