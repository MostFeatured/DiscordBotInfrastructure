"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIModalBuilder = void 0;
const stuffs_1 = require("stuffs");
class DBIModalBuilder {
    component;
    overrides;
    reference;
    constructor(arg) {
        this.component = arg.component;
        this.overrides = arg.overrides ?? {};
        this.reference = arg.reference ?? { data: [] };
    }
    setTTL(ttl) {
        this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
        return this;
    }
    setData(...data) {
        this.reference.data = data;
        return this;
    }
    addData(...data) {
        this.reference.data = [...this.reference.data, ...data];
        return this;
    }
    setOverrides(overrides) {
        this.overrides = overrides;
        return this;
    }
    addOverrides(overrides) {
        this.overrides = (0, stuffs_1.defaultify)(overrides, this.overrides, true);
        return this;
    }
    toJSON() {
        return this.component.toJSON({ overrides: this.overrides, reference: this.reference });
    }
}
exports.DBIModalBuilder = DBIModalBuilder;
//# sourceMappingURL=ModalBuilder.js.map