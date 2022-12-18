"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursiveImport = exports.Utils = exports.createDBI = exports.generatedPath = exports.MemoryStore = void 0;
const tslib_1 = require("tslib");
const DBI_1 = require("./DBI");
const recursiveImport_1 = require("./utils/recursiveImport");
var MemoryStore_1 = require("./utils/MemoryStore");
Object.defineProperty(exports, "MemoryStore", { enumerable: true, get: function () { return MemoryStore_1.MemoryStore; } });
const path_1 = tslib_1.__importDefault(require("path"));
const customId_1 = require("./utils/customId");
exports.generatedPath = path_1.default.resolve(__dirname, "../generated");
function createDBI(namespace, cfg) {
    return new DBI_1.DBI(namespace, cfg);
}
exports.createDBI = createDBI;
;
exports.Utils = {
    parseCustomId: customId_1.parseCustomId,
    buildCustomId: customId_1.buildCustomId,
    recursiveImport: recursiveImport_1.recursiveImport
};
async function recursiveImport(...args) {
    console.log("[DEPRECTED] recursiveImport is a deprected api. Please use Utils.recursiveImport instead.", Error().stack);
    return await recursiveImport_1.recursiveImport.call(this, ...args);
}
exports.recursiveImport = recursiveImport;
//# sourceMappingURL=index.js.map