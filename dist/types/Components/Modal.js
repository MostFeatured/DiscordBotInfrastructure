"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIModal = void 0;
const tslib_1 = require("tslib");
const Interaction_1 = require("../Interaction");
const customId_1 = require("../../utils/customId");
const stuffs_1 = tslib_1.__importDefault(require("stuffs"));
const ModalBuilder_1 = require("../Builders/ModalBuilder");
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
            ...stuffs_1.default.defaultify((arg?.overrides || {}), this.options || {}, true),
            customId: (0, customId_1.buildCustomId)(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
        };
    }
    ;
    createBuilder(arg = {}) {
        return new ModalBuilder_1.DBIModalBuilder({ component: this, ...arg });
    }
}
exports.DBIModal = DBIModal;
//# sourceMappingURL=Modal.js.map