"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIModal = void 0;
const Interaction_1 = require("./Interaction");
const customId_1 = require("../utils/customId");
class DBIModal extends Interaction_1.DBIBaseInteraction {
    constructor(dbi, cfg) {
        super(dbi, {
            ...cfg,
            type: "Modal"
        });
    }
    onExecute(ctx) { }
    ;
    toJSON(...customData) {
        return {
            ...this.options,
            customId: (0, customId_1.customIdBuilder)(this.dbi, this.name, customData)
        };
    }
    ;
}
exports.DBIModal = DBIModal;
//# sourceMappingURL=Modal.js.map