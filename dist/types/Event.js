"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIEvent = void 0;
class DBIEvent {
    type;
    other;
    triggerType;
    id;
    name;
    onExecute;
    ordered;
    dbi;
    disabled = false;
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.type = "Event";
        this.id = cfg.id;
        this.other = cfg.other;
        this.name = cfg.name;
        this.onExecute = cfg.onExecute;
        this.ordered = cfg.ordered ?? false;
        this.triggerType = cfg.triggerType ?? "OneByOneGlobal";
        this.disabled ??= cfg.disabled;
    }
    disable() {
        this.disabled = true;
        return this;
    }
    enable() {
        this.disabled = false;
        return this;
    }
}
exports.DBIEvent = DBIEvent;
//# sourceMappingURL=Event.js.map