import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIUserSelectMenuBuilder, DBIUserSelectMenuOverrides } from "../Builders/UserSelectMenuBuilder";

export interface IDBIUserSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.UserSelectMenuInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIUserSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIUserSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export type SelectMenuDefaultOptions = Omit<Discord.UserSelectMenuComponentData, "customId" | "type" | "options">;

export class DBIUserSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIUserSelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "UserSelectMenu",
    });
  }

  declare options: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBIUserSelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<DBIUserSelectMenuOverrides> = {}): Discord.BaseSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.UserSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIUserSelectMenuOverrides> = {}): DBIUserSelectMenuBuilder<TNamespace> {
    return new DBIUserSelectMenuBuilder({ component: this, ...arg })
  }

}