"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBISelectMenu = void 0;
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
    toJSON(arg = {}) {
        return {
            ...this.options,
            ...(arg?.override || {}),
            customId: (0, customId_1.customIdBuilder)(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.tll)
        };
    }
    ;
}
exports.DBISelectMenu = DBISelectMenu;
//# sourceMappingURL=SelectMenu.js.map