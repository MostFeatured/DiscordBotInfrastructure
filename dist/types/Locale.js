"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBILocale = void 0;
const tslib_1 = require("tslib");
const stuffs = tslib_1.__importStar(require("stuffs"));
class DBILocale {
    name;
    data;
    _data;
    dbi;
    constructor(dbi, cfg) {
        this.dbi = dbi;
        this.name = cfg.name;
        this._data = cfg.data;
        this.data = convert(cfg.data);
    }
}
exports.DBILocale = DBILocale;
function convert(data) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => {
        if (typeof value === "string") {
            return [key, (...args) => {
                    return stuffs.mapReplace(value, Object.fromEntries(args.map((t, i) => [`{${i}}`, t])));
                }];
        }
        else {
            return [key, convert(value)];
        }
    }));
}
//# sourceMappingURL=Locale.js.map