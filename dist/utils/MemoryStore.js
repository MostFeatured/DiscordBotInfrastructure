"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
class MemoryStore {
    store;
    constructor() {
        this.store = {};
    }
    async get(key, defaultValue) {
        let val = lodash_1.default.get(this.store, key);
        if (!val) {
            this.set(key, defaultValue);
            return defaultValue;
        }
        return val;
    }
    async set(key, value) {
        return this.store = lodash_1.default.set(this.store, key, value);
    }
    async del(key) {
        return lodash_1.default.unset(this.store, key);
    }
    async has(key) {
        return lodash_1.default.has(this.store, key);
    }
}
exports.MemoryStore = MemoryStore;
//# sourceMappingURL=MemoryStore.js.map