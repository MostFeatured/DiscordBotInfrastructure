import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
import path from "path";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";
export const generatedPath = path.resolve(__dirname, "../generated");
export function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TOtherType, TNamespace> {
  return new DBI<TOtherType, TNamespace>(namespace, cfg);
}