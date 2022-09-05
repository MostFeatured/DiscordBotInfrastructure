"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIMessageContextMenu = void 0;
const Interaction_1 = require("./Interaction");
class DBIMessageContextMenu extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, cfg) {
        super(dbi, {
            ...cfg,
            type: "MessageContextMenu"
        });
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIMessageContextMenu = DBIMessageContextMenu;
//# sourceMappingURL=MessageContextMenu.js.map