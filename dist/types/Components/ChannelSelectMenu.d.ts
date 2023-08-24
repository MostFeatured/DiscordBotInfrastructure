import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIChannelSelectMenuBuilder, DBIChannelSelectMenuOverrides } from "../Builders/ChannelSelectMenuBuilder";
export interface IDBIChannelSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ChannelSelectMenuInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIChannelSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIChannelSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare type SelectMenuDefaultOptions = Omit<Discord.ChannelSelectMenuComponentData, "customId" | "type" | "options">;
export declare class DBIChannelSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIChannelSelectMenuOmitted<TNamespace>);
    options: SelectMenuDefaultOptions;
    onExecute(ctx: IDBIChannelSelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIChannelSelectMenuOverrides>): Discord.ChannelSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIChannelSelectMenuOverrides>): DBIChannelSelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=ChannelSelectMenu.d.ts.map