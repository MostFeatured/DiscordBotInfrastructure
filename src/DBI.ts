import Discord from "discord.js";
import { IChatInput, ChatInput, IChatInputBuilded } from "./types/ChatInput";

export interface DBIConfig {
  discord: {
    token: string;
    options?: Discord.ClientOptions
  }
  sharding: null | {
    clusterCount: "auto" | number,
    shardCountPerCluster: number
  }
}

export interface DBIRegisterAPI {
  ChatInput: typeof IChatInputBuilded
}

export class DBI {
  namespace: string;
  config: DBIConfig;
  client: Discord.Client<true>;
  interactions: Discord.Collection<string, any>;
  events: Discord.Collection<string, any>;
  constructor(namespace: string, config: DBIConfig) {
    this.namespace = namespace;
    this.config = config;

    this.client = new Discord.Client(config.discord?.options);
  }

  async login(): Promise<any> {
    await this.client.login(this.config.discord.token);
  }

  async register(cb: (api: DBIRegisterAPI) => void | Promise<void>): Promise<any> {
    const self = this;

    const ChatInputBuilded = (class {
      constructor(cfg: IChatInput) {
        return new ChatInput(self, cfg);
      }
    });

    return await cb({
      ChatInput: ChatInputBuilded as any
    });
  }

  async reload(): Promise<any> {

  }
}