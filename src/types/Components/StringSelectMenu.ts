import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIStringSelectMenuBuilder, DBIStringSelectMenuOverrides } from "../Builders/StringSelectMenuBuilder";

export interface IDBIStringSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.StringSelectMenuInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIStringSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIStringSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export type SelectMenuDefaultOptions = Required<Pick<Discord.StringSelectMenuComponentData, "options">> & Omit<Discord.StringSelectMenuComponentData, "customId" | "type" | "options">;

export class DBIStringSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIStringSelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "StringSelectMenu",
    });
  }

  declare options: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBIStringSelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<DBIStringSelectMenuOverrides> = {}): Discord.BaseSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.StringSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIStringSelectMenuOverrides> = {}): DBIStringSelectMenuBuilder<TNamespace> {
    return new DBIStringSelectMenuBuilder({ component: this, ...arg })
  }

}