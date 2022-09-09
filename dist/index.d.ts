import { DBI, DBIConfigConstructor } from "./DBI";
import { LangConstructorObject } from "./types/Locale";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";
export declare function createDBI<TOtherType = Record<string, any>, TDataFormat = LangConstructorObject>(namespace: string, cfg: DBIConfigConstructor): DBI<TOtherType, TDataFormat>;
//# sourceMappingURL=index.d.ts.map