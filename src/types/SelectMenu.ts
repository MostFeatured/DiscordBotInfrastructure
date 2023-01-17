import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { buildCustomId } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
import stuffs from "stuffs";
import { DBISelectMenuBuilder, DBISelectMenuOverrides } from "./SelectMenuBuilder";

export interface IDBISelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ButtonInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBISelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBISelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export type SelectMenuDefaultOptions = Required<Pick<Discord.StringSelectMenuComponentData, "options">> & Omit<Discord.StringSelectMenuComponentData, "customId" | "type" | "options">;

export class DBISelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBISelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "SelectMenu",
    });
  }

  declare options: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBISelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<DBISelectMenuOverrides> = {}): Discord.BaseSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.StringSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBISelectMenuOverrides> = {}): DBISelectMenuBuilder<TNamespace> {
    return new DBISelectMenuBuilder({ component: this, ...arg })
  }

}