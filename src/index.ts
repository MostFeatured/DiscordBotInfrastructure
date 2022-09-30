import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

import path from "path";
export const generatedPath = path.resolve(__dirname, "../generated");

export function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TNamespace, TOtherType> {
  return new DBI<TNamespace, TOtherType>(namespace, cfg);
};