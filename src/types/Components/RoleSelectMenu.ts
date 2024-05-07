import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIRoleSelectMenuBuilder, DBIRoleSelectMenuOverrides } from "../Builders/RoleSelectMenuBuilder";

export interface IDBIRoleSelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.RoleSelectMenuInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIRoleSelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBIRoleSelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder" | "at">;

export type SelectMenuDefaultOptions = Omit<Discord.RoleSelectMenuComponentData, "customId" | "type" | "options">;

export class DBIRoleSelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIRoleSelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "RoleSelectMenu",
    });
  }

  declare options?: SelectMenuDefaultOptions;

  override onExecute(ctx: IDBIRoleSelectMenuExecuteCtx<TNamespace>) { };

  override toJSON(arg: IDBIToJSONArgs<DBIRoleSelectMenuOverrides> = {}): Discord.RoleSelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.RoleSelect,
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIRoleSelectMenuOverrides> = {}): DBIRoleSelectMenuBuilder<TNamespace> {
    return new DBIRoleSelectMenuBuilder({ component: this, ...arg })
  }

}