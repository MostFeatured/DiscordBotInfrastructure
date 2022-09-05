"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBISelectMenu = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const Interaction_1 = require("./Interaction");
const customId_1 = require("../utils/customId");
class DBISelectMenu extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, args) {
        super(dbi, {
            ...args,
            type: "SelectMenu",
        });
    }
    onExecute(ctx) { }
    ;
    toJSON(...customData) {
        return {
            ...this.options,
            customId: (0, customId_1.customIdBuilder)(this.dbi, this.name, customData),
            type: discord_js_1.default.ComponentType.SelectMenu
        };
    }
    ;
}
exports.DBISelectMenu = DBISelectMenu;
//# sourceMappingURL=SelectMenu.js.map