import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBISelectMenuBuilder, DBISelectMenuOverrides } from "./SelectMenuBuilder";
export interface IDBISelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ButtonInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBISelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBISelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare class DBISelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBISelectMenuOmitted<TNamespace>);
    options: Omit<Discord.BaseSelectMenuComponentData, "customId" | "type">;
    onExecute(ctx: IDBISelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBISelectMenuOverrides>): Discord.BaseSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBISelectMenuOverrides>): DBISelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=SelectMenu.d.ts.map