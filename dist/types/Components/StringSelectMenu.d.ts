import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIStringSelectMenuBuilder, DBIStringSelectMenuOverrides } from "../Builders/StringSelectMenuBuilder";
export interface IDBIStringSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.StringSelectMenuInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIStringSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIStringSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare type SelectMenuDefaultOptions = Required<Pick<Discord.StringSelectMenuComponentData, "options">> & Omit<Discord.StringSelectMenuComponentData, "customId" | "type" | "options">;
export declare class DBIStringSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIStringSelectMenuOmitted<TNamespace>);
    options: SelectMenuDefaultOptions;
    onExecute(ctx: IDBIStringSelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIStringSelectMenuOverrides>): Discord.StringSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIStringSelectMenuOverrides>): DBIStringSelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=StringSelectMenu.d.ts.map