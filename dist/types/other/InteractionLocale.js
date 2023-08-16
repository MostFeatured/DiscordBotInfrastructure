"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIInteractionLocale = void 0;
class DBIInteractionLocale {
    name;
    data;
    dbi;
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.name = cfg.name;
        this.data = cfg.data;
    }
}
exports.DBIInteractionLocale = DBIInteractionLocale;
//# sourceMappingURL=InteractionLocale.js.map