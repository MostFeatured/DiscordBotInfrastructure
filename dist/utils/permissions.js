"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducePermissions = void 0;
const discord_js_1 = require("discord.js");
function reducePermissions(permStrings = []) {
    return permStrings.reduce((all, curr) => discord_js_1.PermissionFlagsBits[curr] | all, 0n);
}
exports.reducePermissions = reducePermissions;
//# sourceMappingURL=permissions.js.map