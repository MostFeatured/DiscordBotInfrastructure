"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIChatInput = void 0;
const Interaction_1 = require("../Interaction");
class DBIChatInput extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, cfg) {
        super(dbi, {
            ...cfg,
            type: "ChatInput",
            name: cfg.name.toLowerCase(),
            options: Array.isArray(cfg.options) ? cfg.options : []
        });
        this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
        this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIChatInput = DBIChatInput;
//# sourceMappingURL=ChatInput.js.map