"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLang = exports.DBILocale = void 0;
const tslib_1 = require("tslib");
const stuffs_1 = tslib_1.__importDefault(require("stuffs"));
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
    mergeLocale(locale) {
        this._data = stuffs_1.default.defaultify(locale._data, this._data, true);
        this.data = convertLang(this._data);
        locale.data = this.data;
        locale._data = this._data;
        return this;
    }
}
exports.DBILocale = DBILocale;
function convertLang(data) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => {
        if (typeof value === "string") {
            return [key, (...args) => {
                    return stuffs_1.default.mapReplace(value, args.map((t, i) => [new RegExp(`\\{${i}(;[^}]+)?\\}`, "g"), t]));
                }];
        }
        else {
            return [key, convertLang(value)];
        }
    }));
}
exports.convertLang = convertLang;
//# sourceMappingURL=Locale.js.map