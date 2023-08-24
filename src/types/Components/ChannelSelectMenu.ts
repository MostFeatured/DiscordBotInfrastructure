import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIChannelSelectMenuBuilder, DBIChannelSelectMenuOverrides } from "../Builders/ChannelSelectMenuBuilder";

export interface IDBIChannelSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ChannelSelectMenuInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIChannelSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIChannelSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export type SelectMenuDefaultOptions = Omit<Discord.ChannelSelectMenuComponentData, "customId" | "type" | "options">;

export class DBIChannelSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIChannelSelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "ChannelSelectMenu",
    });
  }

  declare options: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBIChannelSelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<DBIChannelSelectMenuOverrides> = {}): Discord.ChannelSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.ChannelSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIChannelSelectMenuOverrides> = {}): DBIChannelSelectMenuBuilder<TNamespace> {
    return new DBIChannelSelectMenuBuilder({ component: this, ...arg })
  }

}