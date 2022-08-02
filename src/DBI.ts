import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { publishInteractions } from "./methods/publishInteractions";
import { DBIEvent } from "./types/Event";

export interface DBIConfig {
  discord: {
    token: string;
    options?: Discord.ClientOptions
  }
  sharding?: {
    clusterCount: "auto" | number,
    shardCountPerCluster: number
  }

  store?: {
    get(key: string, defaultValue: any): Promise<any>;
    set(key: string): Promise<void>;
    del(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
  }
}

export interface DBIRegisterAPI {
  ChatInput(cfg: TDBIChatInputOmitted): DBIChatInput;
  ChatInputOptions: typeof DBIChatInputOptions;
}

export class DBI {
  namespace: string;
  config: DBIConfig;
  client: Discord.Client<true>;
  data: {
    interactions: Discord.Collection<string, DBIChatInput>;
    events: Discord.Collection<string, DBIEvent>;
    plugins: Discord.Collection<string, any>;
    other: Record<string, any>;
  };
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

    let ChatInput = function (cfg: DBIChatInput) {
      let dbiInteraction = new DBIChatInput(cfg);
        self.data.interactions.set(dbiInteraction.name, dbiInteraction);
        return dbiInteraction;
    };
    ChatInput = Object.assign(ChatInput, class { constructor(...args) { return ChatInput.call(this, ...args); } });

    return await cb({
      ChatInput,
      ChatInputOptions: DBIChatInputOptions
    });
  }

  async reload(): Promise<any> {

  }

  async publish(type: "Global", clear?: boolean): Promise<any>;
  async publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;

  async publish(...args) {
    switch (args[0]) {
      case "Global": {
        return await publishInteractions(
          this.config.discord.token,
          args[1] ? new Discord.Collection() : this.data.interactions,
          args[0]
        );
      }
      case "Guild": {
        return await publishInteractions(
          this.config.discord.token,
          args[2] ? new Discord.Collection() : this.data.interactions,
          args[0],
          args[1]
        );
      }
    }
  }
}