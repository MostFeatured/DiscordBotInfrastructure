"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDBI = exports.generatedPath = exports.MemoryStore = exports.recursiveImport = void 0;
const tslib_1 = require("tslib");
const DBI_1 = require("./DBI");
const path_1 = tslib_1.__importDefault(require("path"));
var recursiveImport_1 = require("./utils/recursiveImport");
Object.defineProperty(exports, "recursiveImport", { enumerable: true, get: function () { return recursiveImport_1.recursiveImport; } });
var MemoryStore_1 = require("./utils/MemoryStore");
Object.defineProperty(exports, "MemoryStore", { enumerable: true, get: function () { return MemoryStore_1.MemoryStore; } });
exports.generatedPath = path_1.default.resolve(__dirname, "../generated");
function createDBI(namespace, cfg) {
    return new DBI_1.DBI(namespace, cfg);
}
exports.createDBI = createDBI;
//# sourceMappingURL=index.js.map