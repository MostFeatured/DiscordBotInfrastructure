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
    setTTL(ttl: number): this;
    setData(...data: (string | number | object)[]): this;
    addData(...data: (string | number | object)[]): this;
    setOverrides(overrides: DBIButtonOverrides): this;
    addOverrides(overrides: DBIButtonOverrides): this;
    toJSON(): ButtonComponentData;
}
//# sourceMappingURL=ButtonBuilder.d.ts.map