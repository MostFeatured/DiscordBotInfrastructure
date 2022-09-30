import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";

export type TDBIUserContextMenuOmitted<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBIUserContextMenu<TNamespace>, "type" | "description" | "dbi" | "options">;

export interface IDBIUserContextMenuExecuteCtx<TNamespace extends NamespaceEnums = NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.UserContextMenuCommandInteraction<"cached">;
}

export class DBIUserContextMenu<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI, cfg: TDBIUserContextMenuOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "UserContextMenu"
    });

    this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
    this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIUserContextMenuExecuteCtx<TNamespace>): Promise<any> | any {}
}