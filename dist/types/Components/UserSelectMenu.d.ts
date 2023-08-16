import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIUserSelectMenuBuilder, DBIUserSelectMenuOverrides } from "../Builders/UserSelectMenuBuilder";
export interface IDBIUserSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.UserSelectMenuInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIUserSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIUserSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare type SelectMenuDefaultOptions = Omit<Discord.UserSelectMenuComponentData, "customId" | "type" | "options">;
export declare class DBIUserSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIUserSelectMenuOmitted<TNamespace>);
    options: SelectMenuDefaultOptions;
    onExecute(ctx: IDBIUserSelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIUserSelectMenuOverrides>): Discord.BaseSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIUserSelectMenuOverrides>): DBIUserSelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=UserSelectMenu.d.ts.map