"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIBaseInteraction = void 0;
class DBIBaseInteraction {
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.name = cfg.name;
        this.description = cfg.description;
        this.onExecute = cfg.onExecute;
        this.type = cfg.type;
        this.options = cfg.options;
        this.other = cfg.other;
        this.publish = cfg.publish ?? dbi.data.clients.first()?.namespace;
        this.rateLimits = cfg.rateLimits ?? [];
    }
    publish;
    dbi;
    name;
    description;
    type;
    options;
    other;
    rateLimits;
    toJSON(overrides) { }
    onExecute(ctx) {
    }
}
exports.DBIBaseInteraction = DBIBaseInteraction;
//# sourceMappingURL=Interaction.js.map