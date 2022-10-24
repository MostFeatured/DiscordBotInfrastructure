import { ButtonComponentData, ButtonStyle } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBIButton } from "./Button";
export declare type DBIButtonOverrides = {
    style?: ButtonStyle;
} & Omit<ButtonComponentData, "customId" | "type" | "style">;
export declare class DBIButtonBuilder<TNamespace extends NamespaceEnums> {
    component: DBIButton<TNamespace>;
    overrides: DBIButtonOverrides;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIButton<TNamespace>;
        overrides?: DBIButtonOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIButtonBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIButtonBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIButtonBuilder<TNamespace>;
    setOverrides(overrides: DBIButtonOverrides): DBIButtonBuilder<TNamespace>;
    addOverrides(overrides: DBIButtonOverrides): DBIButtonBuilder<TNamespace>;
    toJSON(): ButtonComponentData;
}
//# sourceMappingURL=ButtonBuilder.d.ts.map