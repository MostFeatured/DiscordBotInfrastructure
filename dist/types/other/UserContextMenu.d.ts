import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
export declare type TDBIUserContextMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIUserContextMenu<TNamespace>, "type" | "description" | "dbi" | "options" | "toJSON">;
export interface IDBIUserContextMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.UserContextMenuCommandInteraction<"cached">;
}
export declare class DBIUserContextMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, cfg: TDBIUserContextMenuOmitted<TNamespace>);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    onExecute(ctx: IDBIUserContextMenuExecuteCtx<TNamespace>): Promise<void> | void;
}
//# sourceMappingURL=UserContextMenu.d.ts.map