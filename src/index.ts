import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
import { recursiveImport as _recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

import path from "path";
import { parseCustomId, buildCustomId } from "./utils/customId";

export const generatedPath = path.resolve(__dirname, "../generated");

export function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TNamespace, TOtherType> {
  return new DBI<TNamespace, TOtherType>(namespace, cfg);
};

export const Utils = {
  parseCustomId,
  buildCustomId,
  recursiveImport: _recursiveImport
}

export async function recursiveImport(...args) {
  console.log("[DEPRECTED] recursiveImport is a deprected api. Please use Utils.recursiveImport instead.", Error().stack);
  return await _recursiveImport(...(args as any));
}