import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBILocale } from "./Locale";

export interface IDBIBaseExecuteCtx {
  interaction:
    | Discord.ChatInputCommandInteraction
    | Discord.UserContextMenuCommandInteraction
    | Discord.MessageContextMenuCommandInteraction
    | Discord.ModalSubmitInteraction
    | Discord.AutocompleteInteraction
    | Discord.SelectMenuInteraction
    | Discord.ButtonInteraction;
  locale: {
    user: DBILocale,
    guild?: DBILocale
  }
  dbi: DBI;
  setRateLimit(type: TDBIRateLimitTypes, duration: number): Promise<any>;
  other: Record<string, any>;
}

export type TDBIInteractionTypes =
  | "ChatInput"
  | "UserContextMenu"
  | "MessageContextMenu"
  | "Modal"
  | "Autocomplete"
  | "SelectMenu"
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

export class DBIBaseInteraction {
  constructor(dbi: DBI, cfg: Omit<DBIBaseInteraction, "dbi">) {
    this.dbi = dbi;
    this.name = cfg.name;
    this.description = cfg.description;
    this.onExecute = cfg.onExecute;
    this.type = cfg.type;
    this.options = cfg.options;
    this.other = cfg.other;
  }

  dbi: DBI;
  name: string;
  description: string;
  readonly type: TDBIInteractionTypes;
  options?: any | any[];
  other?: Record<string, any>;
  rateLimits?: DBIRateLimit[];
  onExecute(ctx: IDBIBaseExecuteCtx): Promise<any> | any {

  }
}