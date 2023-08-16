import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIRoleSelectMenuBuilder, DBIRoleSelectMenuOverrides } from "../Builders/RoleSelectMenuBuilder";
export interface IDBIRoleSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.RoleSelectMenuInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIRoleSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIRoleSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;
export declare type SelectMenuDefaultOptions = Omit<Discord.RoleSelectMenuComponentData, "customId" | "type" | "options">;
export declare class DBIRoleSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIRoleSelectMenuOmitted<TNamespace>);
    options: SelectMenuDefaultOptions;
    onExecute(ctx: IDBIRoleSelectMenuExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIRoleSelectMenuOverrides>): Discord.BaseSelectMenuComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIRoleSelectMenuOverrides>): DBIRoleSelectMenuBuilder<TNamespace>;
}
//# sourceMappingURL=RoleSelectMenu.d.ts.map