import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIButtonBuilder, DBIButtonOverrides } from "../Builders/ButtonBuilder";

export interface IDBIButtonExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ButtonInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIButtonOmitted<TNamespace extends NamespaceEnums> = Omit<DBIButton<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder" | "at">;

export class DBIButton<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIButtonOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "Button",
    });
  }

  declare options?: Omit<Discord.ButtonComponentData, "customId" | "type">;

  override onExecute(ctx: IDBIButtonExecuteCtx<TNamespace>) { };
  override toJSON(arg: IDBIToJSONArgs<DBIButtonOverrides> = {}): Discord.ButtonComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.Button,
    } as any;
  };
  createBuilder(arg: IDBIToJSONArgs<DBIButtonOverrides> = {}): DBIButtonBuilder<TNamespace> {
    return new DBIButtonBuilder({ component: this, ...arg })
  }

}