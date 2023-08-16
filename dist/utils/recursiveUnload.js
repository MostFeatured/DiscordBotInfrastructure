"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursiveUnload = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const unloadModule_1 = require("./unloadModule");
/**
 * @example
 * await recursiveUnload("./src", [".js"], [".d.ts"])
 * await dbi.unload()
 */
async function recursiveUnload(folderPath, exts = [".js"], ignore = [".d.ts", ".js.map", ".d.ts.map"]) {
    let files = await fs_1.default.promises.readdir(folderPath, { withFileTypes: true });
    let dirName = __dirname;
    for (const file of files) {
        let filePath = path_1.default.resolve(folderPath, file.name);
        let relative = path_1.default.relative(dirName, filePath);
        if (!relative.includes(`${path_1.default.sep}-`)) {
            if (file.isDirectory()) {
                await recursiveUnload(filePath, exts);
            }
            else if (exts.some(i => file.name.endsWith(i)) && !ignore.some(i => file.name.endsWith(i))) {
                (0, unloadModule_1.unloadModule)(filePath);
            }
        }
    }
}
exports.recursiveUnload = recursiveUnload;
//# sourceMappingURL=recursiveUnload.js.map