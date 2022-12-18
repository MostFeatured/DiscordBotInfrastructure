"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursiveImport = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
/**
 * @example
 * await recursiveImport("./src", [".js"], [".d.ts"])
 */
async function recursiveImport(folderPath, exts = [".js"], ignore = [".d.ts", ".js.map", ".d.ts.map"]) {
    let files = await fs_1.default.promises.readdir(folderPath, { withFileTypes: true });
    let dirName = __dirname;
    for (const file of files) {
        let filePath = path_1.default.resolve(folderPath, file.name);
        let relative = path_1.default.relative(dirName, filePath);
        if (!relative.includes(`${path_1.default.sep}-`)) {
            if (file.isDirectory()) {
                await recursiveImport(filePath, exts);
            }
            else if (exts.some(i => file.name.endsWith(i)) && !ignore.some(i => file.name.endsWith(i))) {
                await Promise.resolve().then(() => tslib_1.__importStar(require(filePath)));
            }
        }
    }
}
exports.recursiveImport = recursiveImport;
//# sourceMappingURL=recursiveImport.js.map