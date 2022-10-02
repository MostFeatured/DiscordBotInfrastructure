import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
export declare type TDBIMessageContextMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIMessageContextMenu<TNamespace>, "type" | "description" | "dbi" | "options">;
export interface IDBIMessageContextMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.MessageContextMenuCommandInteraction<"cached">;
}
export declare class DBIMessageContextMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, cfg: TDBIMessageContextMenuOmitted<TNamespace>);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    onExecute(ctx: IDBIMessageContextMenuExecuteCtx<TNamespace>): Promise<void> | void;
}
//# sourceMappingURL=MessageContextMenu.d.ts.map