"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDBI = exports.MemoryStore = exports.recursiveImport = void 0;
const DBI_1 = require("./DBI");
var recursiveImport_1 = require("./utils/recursiveImport");
Object.defineProperty(exports, "recursiveImport", { enumerable: true, get: function () { return recursiveImport_1.recursiveImport; } });
var MemoryStore_1 = require("./utils/MemoryStore");
Object.defineProperty(exports, "MemoryStore", { enumerable: true, get: function () { return MemoryStore_1.MemoryStore; } });
function createDBI(namespace, cfg) {
    return new DBI_1.DBI(namespace, cfg);
}
exports.createDBI = createDBI;
//# sourceMappingURL=index.js.map