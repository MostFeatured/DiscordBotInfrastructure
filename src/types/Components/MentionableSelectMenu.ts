import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIMentionableSelectMenuBuilder, DBIMentionableSelectMenuOverrides } from "../Builders/MentionableSelectMenuBuilder";

export interface IDBIMentionableSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.MentionableSelectMenuInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIMentionableSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIMentionableSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export type SelectMenuDefaultOptions = Omit<Discord.MentionableSelectMenuComponentData, "customId" | "type" | "options">;

export class DBIMentionableSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIMentionableSelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "MentionableSelectMenu",
    });
  }

  declare options: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBIMentionableSelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  override toJSON(arg: IDBIToJSONArgs<DBIMentionableSelectMenuOverrides> = {}): Discord.MentionableSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.MentionableSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIMentionableSelectMenuOverrides> = {}): DBIMentionableSelectMenuBuilder<TNamespace> {
    return new DBIMentionableSelectMenuBuilder({ component: this, ...arg })
  }

}