import { BaseSelectMenuComponentData, UserSelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIUserSelectMenu } from "../Components/UserSelectMenu";
export declare type DBIUserSelectMenuOverrides = Omit<UserSelectMenuComponentData, "customId" | "type">;
export declare class DBIUserSelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBIUserSelectMenu<TNamespace>;
    overrides: Partial<DBIUserSelectMenuOverrides>;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIUserSelectMenu<TNamespace>;
        overrides?: DBIUserSelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIUserSelectMenuBuilder<TNamespace>;
    addTTL(ttl: number): DBIUserSelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIUserSelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIUserSelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBIUserSelectMenuOverrides): DBIUserSelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBIUserSelectMenuOverrides): DBIUserSelectMenuBuilder<TNamespace>;
    toJSON(): BaseSelectMenuComponentData;
}
//# sourceMappingURL=UserSelectMenuBuilder.d.ts.map