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
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIUserContextMenu = DBIUserContextMenu;
//# sourceMappingURL=UserContextMenu.js.map