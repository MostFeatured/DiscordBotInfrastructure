"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIUserContextMenu = void 0;
const Interaction_1 = require("./Interaction");
class DBIUserContextMenu extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, cfg) {
        super(dbi, {
            ...cfg,
            type: "UserContextMenu"
        });
        this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
        this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIUserContextMenu = DBIUserContextMenu;
//# sourceMappingURL=UserContextMenu.js.map