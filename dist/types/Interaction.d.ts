import Discord from "discord.js";
import { NamespaceEnums, NamespaceData } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { DBIButton } from "./Button";
import { DBIChatInput } from "./ChatInput/ChatInput";
import { DBILocale } from "./Locale";
import { DBIMessageContextMenu } from "./MessageContextMenu";
import { DBIModal } from "./Modal";
import { DBISelectMenu } from "./SelectMenu";
import { DBIUserContextMenu } from "./UserContextMenu";
export declare type TDBIInteractions<TNamespace extends NamespaceEnums> = DBIChatInput<TNamespace> | DBIButton<TNamespace> | DBISelectMenu<TNamespace> | DBIMessageContextMenu<TNamespace> | DBIUserContextMenu<TNamespace> | DBIModal<TNamespace>;
export interface IDBIBaseExecuteCtx<TNamespace extends NamespaceEnums> {
    interaction: Discord.ChatInputCommandInteraction | Discord.UserContextMenuCommandInteraction | Discord.MessageContextMenuCommandInteraction | Discord.ModalSubmitInteraction | Discord.AutocompleteInteraction | Discord.SelectMenuInteraction | Discord.ButtonInteraction;
    locale: {
        user: DBILocale<TNamespace>;
        guild?: DBILocale<TNamespace>;
    };
    dbi: DBI<TNamespace>;
    dbiInteraction: TDBIInteractions<TNamespace>;
    setRateLimit(type: TDBIRateLimitTypes, duration: number): Promise<any>;
    other: Record<string, any>;
    clientNamespace: NamespaceData[TNamespace]["clientNamespaces"];
}
export declare type TDBIReferencedData = ({
    [key: string]: any;
    $ref: string;
    $unRef(): boolean;
} | string | number);
export declare type TDBIInteractionTypes = "ChatInput" | "UserContextMenu" | "MessageContextMenu" | "Modal" | "Autocomplete" | "SelectMenu" | "Button";
export declare type TDBIRateLimitTypes = "User" | "Channel" | "Guild" | "Member" | "Message";
export declare type DBIRateLimit = {
    type: TDBIRateLimitTypes;
    /**
     * Duration in milliseconds.
     */
    duration: number;
};
export declare class DBIBaseInteraction<TNamespace extends NamespaceEnums> {
    constructor(dbi: DBI<TNamespace>, cfg: Omit<DBIBaseInteraction<TNamespace>, "dbi">);
    publish?: NamespaceData[TNamespace]["clientNamespaces"];
    dbi: DBI<TNamespace>;
    name: string;
    description: string;
    readonly type: TDBIInteractionTypes;
    options?: any | any[];
    other?: Record<string, any>;
    rateLimits?: DBIRateLimit[];
    onExecute(ctx: IDBIBaseExecuteCtx<TNamespace>): Promise<void> | void;
}
//# sourceMappingURL=Interaction.d.ts.map