import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ModalSubmitInteraction<"cached">;
    data: TDBIReferencedData[];
}
export interface ModalComponentData {
    title: string;
    components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}
export declare type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBIModalOmitted);
    options: ModalComponentData;
    onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any;
    toJSON(arg?: IDBIToJSONArgs<ModalComponentData>): Discord.ModalComponentData;
}
//# sourceMappingURL=Modal.d.ts.map