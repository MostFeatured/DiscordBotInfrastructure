import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBIButtonBuilder, DBIButtonOverrides } from "./ButtonBuilder";
export interface IDBIButtonExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ButtonInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIButtonOmitted<TNamespace extends NamespaceEnums> = Omit<DBIButton<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare class DBIButton<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIButtonOmitted<TNamespace>);
    options?: Omit<Discord.ButtonComponentData, "customId" | "type">;
    onExecute(ctx: IDBIButtonExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIButtonOverrides>): Discord.ButtonComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIButtonOverrides>): DBIButtonBuilder<TNamespace>;
}
//# sourceMappingURL=Button.d.ts.map