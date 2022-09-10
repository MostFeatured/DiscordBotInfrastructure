import { DBI, DBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";
export declare function createDBI<TOtherType = Record<string, any>>(namespace: string, cfg: DBIConfigConstructor): DBI<TOtherType>;
//# sourceMappingURL=index.d.ts.map