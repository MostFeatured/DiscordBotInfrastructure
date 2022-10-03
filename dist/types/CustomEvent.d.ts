import { NamespaceEnums, NamespaceData } from "../../generated/namespaceData";
import { DBI } from "../DBI";
export declare type TDBICustomEventOmitted<TNamespace extends NamespaceEnums, CEventName extends keyof NamespaceData[TNamespace]["customEvents"] = keyof NamespaceData[TNamespace]["customEvents"]> = Omit<DBICustomEvent<TNamespace, CEventName>, "type" | "dbi" | "toJSON" | "trigger">;
export declare class DBICustomEvent<TNamespace extends NamespaceEnums, CEventName extends keyof NamespaceData[TNamespace]["customEvents"] = keyof NamespaceData[TNamespace]["customEvents"]> {
    dbi: DBI<TNamespace>;
    name: CEventName;
    map: {
        [key: string]: string;
    };
    type: string;
    trigger(args: NamespaceData[TNamespace]["customEvents"][CEventName]): boolean;
    constructor(dbi: DBI<TNamespace>, cfg: TDBICustomEventOmitted<TNamespace, CEventName>);
}
//# sourceMappingURL=CustomEvent.d.ts.map