import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";

export interface IDBIChatInputExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ChatInputCommandInteraction<"cached">;
}

export type TDBIChatInputOmitted = Omit<DBIChatInput, "type" | "dbi">;

export class DBIChatInput<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI, cfg: TDBIChatInputOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "ChatInput",
      name: cfg.name.toLowerCase(),
      options: Array.isArray(cfg.options) ? cfg.options : []
    });

    this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
    this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  declare options?: any[];
  override onExecute(ctx: IDBIChatInputExecuteCtx<TNamespace>) {}
}