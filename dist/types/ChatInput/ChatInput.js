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
    }
    directMessages;
    defaultMemberPermissions;
    onExecute(ctx) { }
}
exports.DBIChatInput = DBIChatInput;
//# sourceMappingURL=ChatInput.js.map