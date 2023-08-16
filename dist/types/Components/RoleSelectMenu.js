"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIRoleSelectMenu = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const Interaction_1 = require("../Interaction");
const customId_1 = require("../../utils/customId");
const stuffs_1 = tslib_1.__importDefault(require("stuffs"));
const RoleSelectMenuBuilder_1 = require("../Builders/RoleSelectMenuBuilder");
class DBIRoleSelectMenu extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, args) {
        super(dbi, {
            ...args,
            type: "RoleSelectMenu",
        });
    }
    onExecute(ctx) { }
    ;
    toJSON(arg = {}) {
        return {
            ...stuffs_1.default.defaultify((arg?.overrides || {}), this.options || {}, true),
            customId: (0, customId_1.buildCustomId)(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
            type: discord_js_1.default.ComponentType.RoleSelect,
        };
    }
    ;
    createBuilder(arg = {}) {
        return new RoleSelectMenuBuilder_1.DBIRoleSelectMenuBuilder({ component: this, ...arg });
    }
}
exports.DBIRoleSelectMenu = DBIRoleSelectMenu;
//# sourceMappingURL=RoleSelectMenu.js.map