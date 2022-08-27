import Discord from "discord.js";
import { DBI } from "../DBI";

export interface IDBIBaseExecuteCtx {
  interaction:
    | Discord.ChatInputCommandInteraction
    | Discord.UserContextMenuCommandInteraction
    | Discord.MessageContextMenuCommandInteraction
    | Discord.ModalSubmitInteraction
    | Discord.AutocompleteInteraction
    | Discord.SelectMenuInteraction
    | Discord.ButtonInteraction;
  locale: any;
  other: any;
  DBI: DBI;
  setRateLimit(type: TDBIRateLimitTypes, duration: number): Promise<any>;
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
  constructor(cfg: DBIBaseInteraction) {
    this.name = cfg.name;
    this.description = cfg.description;
    this.onExecute = cfg.onExecute;
    this.type = cfg.type;
    this.options = cfg.options;
    this.other = cfg.other;
  }

  name: string;
  description: string;
  readonly type: TDBIInteractionTypes;
  options?: any | any[];
  other?: Record<string, any>;
  rateLimits?: DBIRateLimit[];
  onExecute(ctx: IDBIBaseExecuteCtx): Promise<any> | any {

  }
}