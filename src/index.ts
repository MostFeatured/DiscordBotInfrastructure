import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

export function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TOtherType, TNamespace> {
  return new DBI<TOtherType, TNamespace>(namespace, cfg);
}