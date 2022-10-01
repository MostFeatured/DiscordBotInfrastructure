import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";
export interface IDBIChatInputExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ChatInputCommandInteraction<"cached">;
}
export declare type TDBIChatInputOmitted<TNamespace extends NamespaceEnums> = Omit<DBIChatInput<TNamespace>, "type" | "dbi">;
export declare class DBIChatInput<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace, {}>, cfg: TDBIChatInputOmitted<TNamespace>);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    options?: any[];
    onExecute(ctx: IDBIChatInputExecuteCtx<TNamespace>): void;
}
//# sourceMappingURL=ChatInput.d.ts.map