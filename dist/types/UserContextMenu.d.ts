import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
export declare type TDBIUserContextMenuOmitted<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBIUserContextMenu<TNamespace>, "type" | "description" | "dbi" | "options">;
export interface IDBIUserContextMenuExecuteCtx<TNamespace extends NamespaceEnums = NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.UserContextMenuCommandInteraction<"cached">;
}
export declare class DBIUserContextMenu<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI, cfg: TDBIUserContextMenuOmitted);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    onExecute(ctx: IDBIUserContextMenuExecuteCtx<TNamespace>): Promise<any> | any;
}
//# sourceMappingURL=UserContextMenu.d.ts.map