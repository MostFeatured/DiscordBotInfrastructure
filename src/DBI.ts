import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { EventEmitter } from "eventemitter3";
import { publishInteractions } from "./methods/publishInteractions";

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
  ChatInput(cfg: TDBIChatInputOmitted): DBIChatInput;
  ChatInputOptions: typeof DBIChatInputOptions;
}

export class DBI extends EventEmitter {
  namespace: string;
  config: DBIConfig;
  client: Discord.Client<true>;
  data: {
    interactions: Discord.Collection<string, DBIChatInput>;
    events: Discord.Collection<string, any>;
    plugins: Discord.Collection<string, any>;
  };
  constructor(namespace: string, config: DBIConfig) {
    super();

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