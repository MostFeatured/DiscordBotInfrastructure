import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
import stuffs from "stuffs";


export interface IDBISelectMenuExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ButtonInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBISelectMenuOmitted<TNamespace extends NamespaceEnums> = Omit<DBISelectMenu<TNamespace>, "type" | "description" | "dbi" | "toJSON">;

export class DBISelectMenu<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBISelectMenuOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "SelectMenu",
    });
  }

  declare options: Omit<Discord.SelectMenuComponentData, "customId" | "type">;

  override onExecute(ctx: IDBISelectMenuExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<Omit<Discord.SelectMenuComponentData, "customId" | "type">> = {} as any): Discord.SelectMenuComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: customIdBuilder(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl),
      type: Discord.ComponentType.SelectMenu,
    } as any;
  };
}