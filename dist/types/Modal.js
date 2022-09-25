"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIModal = void 0;
const Interaction_1 = require("./Interaction");
const customId_1 = require("../utils/customId");
class DBIModal extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, args) {
        super(dbi, {
            ...args,
            type: "Modal"
        });
    }
    onExecute(ctx) { }
    ;
    toJSON(arg = {}) {
        return {
            ...this.options,
            ...(arg?.override || {}),
            customId: (0, customId_1.customIdBuilder)(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
        };
    }
    ;
}
exports.DBIModal = DBIModal;
//# sourceMappingURL=Modal.js.map