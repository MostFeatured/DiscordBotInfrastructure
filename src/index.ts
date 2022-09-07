import { DBI, DBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

export function createDBI<TOtherType = Record<string, any>>(namespace: string, cfg: DBIConfigConstructor): DBI<TOtherType> {
  return new DBI<TOtherType>(namespace, cfg);
}