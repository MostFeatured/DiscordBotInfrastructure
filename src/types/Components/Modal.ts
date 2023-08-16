import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "../Interaction";
import Discord from "discord.js";
import { buildCustomId } from "../../utils/customId";
import { IDBIToJSONArgs } from "../../utils/UtilTypes";
import { NamespaceEnums } from "../../../generated/namespaceData";
import stuffs from "stuffs";
import { DBIModalBuilder, DBIModalOverrides } from "../Builders/ModalBuilder";


export interface IDBIModalExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.ModalSubmitInteraction<"cached">;
  data: TDBIReferencedData[];
}

export interface ModalComponentData {
  title: string;
  components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}

export type TDBIModalOmitted<TNamespace extends NamespaceEnums> = Omit<DBIModal<TNamespace>, "type" | "description" | "dbi" | "toJSON" | "createBuilder">;

export class DBIModal<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI<TNamespace>, args: TDBIModalOmitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "Modal"
    });
  }

  declare options: ModalComponentData;

  override onExecute(ctx: IDBIModalExecuteCtx<TNamespace>): Promise<void> | void { };

  toJSON(arg: IDBIToJSONArgs<DBIModalOverrides> = {}): Discord.ModalComponentData {
    return {
      ...stuffs.defaultify((arg?.overrides || {}), this.options || {}, true),
      customId: buildCustomId(this.dbi as any, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
    } as any;
  };

  createBuilder(arg: IDBIToJSONArgs<DBIModalOverrides> = {}): DBIModalBuilder<TNamespace> {
    return new DBIModalBuilder({ component: this, ...arg })
  }

}