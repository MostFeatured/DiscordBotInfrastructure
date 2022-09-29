"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLang = exports.DBILocale = void 0;
const tslib_1 = require("tslib");
// @ts-ignore
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
        this.data = convertLang(cfg.data);
    }
}
exports.DBILocale = DBILocale;
function convertLang(data) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => {
        if (typeof value === "string") {
            return [key, (...args) => {
                    return stuffs.mapReplace(value, Object.fromEntries(args.map((t, i) => [`{${i}}`, t])));
                }];
        }
        else {
            return [key, convertLang(value)];
        }
    }));
}
exports.convertLang = convertLang;
//# sourceMappingURL=Locale.js.map