import Discord from "discord.js";
import { NamespaceEnums, NamespaceData } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { DBIButton } from "./Components/Button";
import { DBIChatInput } from "./ChatInput/ChatInput";
import { DBILocale } from "./other/Locale";
import { DBIMessageContextMenu } from "./other/MessageContextMenu";
import { DBIModal } from "./Components/Modal";
import { DBIStringSelectMenu } from "./Components/StringSelectMenu";
import { DBIUserContextMenu } from "./other/UserContextMenu";

export type TDBIInteractions<TNamespace extends NamespaceEnums> = DBIChatInput<TNamespace> | DBIButton<TNamespace> | DBIStringSelectMenu<TNamespace> | DBIMessageContextMenu<TNamespace> | DBIUserContextMenu<TNamespace> | DBIModal<TNamespace>;

export interface IDBIBaseExecuteCtx<TNamespace extends NamespaceEnums> {
  interaction:
  | Discord.ChatInputCommandInteraction
  | Discord.UserContextMenuCommandInteraction
  | Discord.MessageContextMenuCommandInteraction
  | Discord.ModalSubmitInteraction
  | Discord.AutocompleteInteraction
  | Discord.AnySelectMenuInteraction
  | Discord.ButtonInteraction;
  locale: {
    user: DBILocale<TNamespace>,
    guild?: DBILocale<TNamespace>
  }
  dbi: DBI<TNamespace>;
  dbiInteraction: TDBIInteractions<TNamespace>;
  setRateLimit(type: TDBIRateLimitTypes, duration: number): Promise<any>;
  other: Record<string, any>;
  clientNamespace: NamespaceData[TNamespace]["clientNamespaces"];
}

export type TDBIReferencedData = ({ [key: string]: any, $ref: string, $unRef(): boolean } | string | number);

export type TDBIInteractionTypes =
  | "ChatInput"
  | "UserContextMenu"
  | "MessageContextMenu"
  | "Modal"
  | "Autocomplete"
  | "StringSelectMenu"
  | "UserSelectMenu"
  | "ChannelSelectMenu"
  | "MentionableSelectMenu"
  | "RoleSelectMenu"
  | "Button";

export type TDBIRateLimitTypes =
  | "User"
  | "Channel"
  | "Guild"
  | "Member"
  | "Message";


export type DBIRateLimit = {
  type: TDBIRateLimitTypes;
  /**
   * Duration in milliseconds.
   */
  duration: number;
}

export class DBIBaseInteraction<TNamespace extends NamespaceEnums> {
  constructor(dbi: DBI<TNamespace>, cfg: Omit<DBIBaseInteraction<TNamespace>, "dbi">) {
    this.dbi = dbi;
    this.name = cfg.name;
    this.description = cfg.description;
    this.onExecute = cfg.onExecute;
    this.type = cfg.type;
    this.publishType = cfg.publishType;
    this.options = cfg.options;
    this.other = cfg.other;
    this.publish = cfg.publish ?? dbi.data.clients.first()?.namespace;
    this.rateLimits = cfg.rateLimits ?? [];
  }

  publish?: NamespaceData[TNamespace]["clientNamespaces"];
  publishType?: "Global" | "Guild" | "None"
  dbi: DBI<TNamespace>;
  name: string;
  description: string;
  readonly type: TDBIInteractionTypes;
  options?: any | any[];
  other?: Record<string, any> & { messageCommand?: { aliases?: string[] } };
  rateLimits?: DBIRateLimit[];
  toJSON(overrides: any): any { }

  onExecute(ctx: IDBIBaseExecuteCtx<TNamespace>): Promise<void> | void {

  }
}
