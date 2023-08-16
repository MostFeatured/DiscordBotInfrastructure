"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unloadModule = void 0;
function unloadModule(modulePath) {
    let nodeModule = require.cache[modulePath];
    if (nodeModule) {
        for (let child of nodeModule.children)
            unloadModule(child.id);
    }
    delete require.cache[modulePath];
}
exports.unloadModule = unloadModule;
//# sourceMappingURL=unloadModule.js.map