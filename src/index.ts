import { namespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

export function createDBI<TOtherType = Record<string, any>, TNamespace extends namespaceEnums = namespaceEnums>(namespace: namespaceEnums, cfg: DBIConfigConstructor): DBI<TOtherType> {
  return new DBI<TOtherType, TNamespace>(namespace, cfg);
}

let testDbi = createDBI<{},"test">("test", {discord: {token: "sa", options: {intents: []}}})