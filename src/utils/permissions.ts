import { PermissionFlagsBits, PermissionsString } from "discord.js";

export function reducePermissions(permStrings: PermissionsString[] = []): bigint {
  return permStrings.reduce((all, curr) => PermissionFlagsBits[curr] | all, 0n);
}