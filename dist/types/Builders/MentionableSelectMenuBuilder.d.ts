import { BaseSelectMenuComponentData, MentionableSelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIMentionableSelectMenu } from "../Components/MentionableSelectMenu";
import { RecursivePartial } from "../../utils/UtilTypes";
export declare type DBIMentionableSelectMenuOverrides = RecursivePartial<Omit<MentionableSelectMenuComponentData, "customId" | "type">>;
export declare class DBIMentionableSelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBIMentionableSelectMenu<TNamespace>;
    overrides: DBIMentionableSelectMenuOverrides;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIMentionableSelectMenu<TNamespace>;
        overrides?: DBIMentionableSelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIMentionableSelectMenuBuilder<TNamespace>;
    addTTL(ttl: number): DBIMentionableSelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIMentionableSelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIMentionableSelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBIMentionableSelectMenuOverrides): DBIMentionableSelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBIMentionableSelectMenuOverrides): DBIMentionableSelectMenuBuilder<TNamespace>;
    toJSON(): BaseSelectMenuComponentData;
}
//# sourceMappingURL=MentionableSelectMenuBuilder.d.ts.map