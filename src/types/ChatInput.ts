import Discord from "discord.js";
import { DBI } from "../DBI";

export interface IExecuteAPI {
  interaction: Discord.ChatInputCommandInteraction
}

export interface IChatInput {
  name: string;
  onExecute(api: IExecuteAPI): Promise<any> | any;
  options?: any[];
}

export class IChatInputBuilded {
  constructor(cfg: IChatInput) {};
}

export class ChatInput implements IChatInput {
  public DBI: DBI;
  public name: string;
  public onExecute(_api: IExecuteAPI): Promise<any> | any {};
  public options?: any[] = [];
  constructor(DBI: DBI, cfg: IChatInput) {
    this.DBI = DBI;

    this.name = cfg.name;
    this.onExecute = cfg.onExecute;
    this.options = cfg.options;
  }
}