import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
import { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";
import { parseCustomId, buildCustomId } from "./utils/customId";
import { unloadModule } from "./utils/unloadModule";
import { recursiveUnload } from "./utils/recursiveUnload";
export declare const generatedPath: string;
export declare function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TNamespace, TOtherType>;
export declare const Utils: {
    parseCustomId: typeof parseCustomId;
    buildCustomId: typeof buildCustomId;
    recursiveImport: typeof recursiveImport;
    unloadModule: typeof unloadModule;
    recursiveUnload: typeof recursiveUnload;
};
//# sourceMappingURL=index.d.ts.map