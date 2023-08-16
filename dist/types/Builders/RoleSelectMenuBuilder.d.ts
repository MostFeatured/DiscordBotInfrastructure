import { BaseSelectMenuComponentData, RoleSelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIRoleSelectMenu } from "../Components/RoleSelectMenu";
export declare type DBIRoleSelectMenuOverrides = Omit<RoleSelectMenuComponentData, "customId" | "type">;
export declare class DBIRoleSelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBIRoleSelectMenu<TNamespace>;
    overrides: Partial<DBIRoleSelectMenuOverrides>;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIRoleSelectMenu<TNamespace>;
        overrides?: DBIRoleSelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIRoleSelectMenuBuilder<TNamespace>;
    addTTL(ttl: number): DBIRoleSelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIRoleSelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIRoleSelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBIRoleSelectMenuOverrides): DBIRoleSelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBIRoleSelectMenuOverrides): DBIRoleSelectMenuBuilder<TNamespace>;
    toJSON(): BaseSelectMenuComponentData;
}
//# sourceMappingURL=RoleSelectMenuBuilder.d.ts.map