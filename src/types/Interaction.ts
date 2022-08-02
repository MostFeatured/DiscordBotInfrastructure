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
}

export type TDBIInteractionTypes =
  | "ChatInput"
  | "UserContextMenu"
  | "MessageContextMenu"
  | "Modal"
  | "Autocomplete"
  | "SelectMenu"
  | "Button";

export type TDBICooldownTypes =
  | "User"
  | "Channel"
  | "Guild"
  | "Member"
  | "Message";


export type DBICooldown = {
  type: TDBICooldownTypes;
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
    this.options = this.options;
    this.other = cfg.other;
  }

  name: string;
  description: string;
  readonly type: TDBIInteractionTypes;
  options?: any;
  other?: Record<string, any>;
  cooldowns?: DBICooldown[];
  onExecute(ctx: IDBIBaseExecuteCtx): Promise<any> | any {

  }
}