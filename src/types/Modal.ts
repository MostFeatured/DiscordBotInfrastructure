import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { customIdBuilder } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";

export interface IDBIModalExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ModalSubmitInteraction<"cached">;

  data: TDBIReferencedData[];
}

export interface ModalComponentData {
  title: string;
  components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}

export type TDBIModalOmitted<TNamespace extends NamespaceEnums> = Omit<DBIModal<TNamespace>, "type" | "description" | "dbi" | "toJSON">;

export class DBIModal<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIModalOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "Modal"
    });
  }

  declare options: ModalComponentData;

  override onExecute(ctx: IDBIModalExecuteCtx<TNamespace>): Promise<any> | any { };

  toJSON(arg: IDBIToJSONArgs<ModalComponentData> = {} as any): Discord.ModalComponentData {
    return {
      ...this.options,
      ...(arg?.override || {}),
      customId: customIdBuilder(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
    } as any;
  };
}