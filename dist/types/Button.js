"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIButton = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const Interaction_1 = require("./Interaction");
const customId_1 = require("../utils/customId");
const stuffs_1 = tslib_1.__importDefault(require("stuffs"));
class DBIButton extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, args) {
        super(dbi, {
            ...args,
            type: "Button",
        });
    }
    onExecute(ctx) { }
    ;
    toJSON(arg = {}) {
        return {
            ...stuffs_1.default.defaultify((arg?.overrides || {}), this.options || {}, true),
            customId: (0, customId_1.customIdBuilder)(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
            type: discord_js_1.default.ComponentType.Button,
        };
    }
    ;
}
exports.DBIButton = DBIButton;
//# sourceMappingURL=Button.js.map