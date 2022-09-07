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
        this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
        this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIMessageContextMenu = DBIMessageContextMenu;
//# sourceMappingURL=MessageContextMenu.js.map