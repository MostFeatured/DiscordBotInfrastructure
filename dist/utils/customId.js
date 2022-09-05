"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCustomId = exports.customIdBuilder = void 0;
const tslib_1 = require("tslib");
const stuffs = tslib_1.__importStar(require("stuffs"));
function customIdBuilder(dbi, name, customData) {
    let customId = [
        name,
        ...customData.map(value => {
            if (typeof value == "string")
                return value;
            if (typeof value == "number")
                return `π${value}`;
            let id = stuffs.randomString(8);
            Object.assign(value, {
                $ref: id,
                $unRef() { return dbi.data.refs.delete(id); },
            });
            dbi.data.refs.set(id, { at: Date.now(), value });
            return `¤${id}`;
        })
    ].join("—");
    if (customId.length > 100)
        throw new Error("Custom id cannot be longer than 100 characters.");
    return customId;
}
exports.customIdBuilder = customIdBuilder;
function parseCustomId(dbi, customId) {
    let splitted = customId.split("—");
    let name = splitted.shift();
    let data = splitted.map(value => {
        if (value.startsWith("π"))
            return Number(value.slice(1));
        if (value.startsWith("¤"))
            return dbi.data.refs.get(value.slice(1))?.value;
        return value;
    });
    return {
        name,
        data
    };
}
exports.parseCustomId = parseCustomId;
//# sourceMappingURL=customId.js.map