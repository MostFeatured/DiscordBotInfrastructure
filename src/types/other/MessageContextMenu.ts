import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";

export type TDBIMessageContextMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIMessageContextMenu<TNamespace>, "type" | "description" | "dbi" | "options" | "toJSON">;

export interface IDBIMessageContextMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.MessageContextMenuCommandInteraction<"cached">;
}


export class DBIMessageContextMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, cfg: TDBIMessageContextMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(cfg as any),
      type: "MessageContextMenu"
    });

    this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
    this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
  }

  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIMessageContextMenuExecuteCtx<TNamespace>): Promise<void> | void {}
}