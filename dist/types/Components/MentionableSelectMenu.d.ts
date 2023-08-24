import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIMentionableSelectMenuBuilder, DBIMentionableSelectMenuOverrides } from "../Builders/MentionableSelectMenuBuilder";
export interface IDBIMentionableSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.MentionableSelectMenuInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIMentionableSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIMentionableSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare type SelectMenuDefaultOptions = Omit<Discord.MentionableSelectMenuComponentData, "customId" | "type" | "options">;
export declare class DBIMentionableSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIMentionableSelectMenuOmitted<TNamespace>);
    options: SelectMenuDefaultOptions;
    onExecute(ctx: IDBIMentionableSelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIMentionableSelectMenuOverrides>): Discord.MentionableSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIMentionableSelectMenuOverrides>): DBIMentionableSelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=MentionableSelectMenu.d.ts.map