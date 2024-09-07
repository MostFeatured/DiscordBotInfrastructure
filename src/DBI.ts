import Discord, { MessagePayload } from "discord.js";
import {
  DBIChatInput,
  TDBIChatInputOmitted,
} from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { publishInteractions } from "./methods/publishInteractions";
import { ClientEvents, DBIEvent, TDBIEventOmitted } from "./types/Event";
import { MemoryStore } from "./utils/MemoryStore";
import { hookInteractionListeners } from "./methods/hookInteractionListeners";
import { Events } from "./Events";
import {
  DBILocale,
  TDBILocaleConstructor,
  TDBILocaleString,
} from "./types/other/Locale";
import { DBIButton, TDBIButtonOmitted } from "./types/Components/Button";
import {
  DBIStringSelectMenu,
  TDBIStringSelectMenuOmitted,
} from "./types/Components/StringSelectMenu";
import {
  DBIMessageContextMenu,
  TDBIMessageContextMenuOmitted,
} from "./types/other/MessageContextMenu";
import {
  DBIUserContextMenu,
  TDBIUserContextMenuOmitted,
} from "./types/other/UserContextMenu";
import { hookEventListeners } from "./methods/hookEventListeners";
import eventMap from "./data/eventMap.json";
import { DBIModal, TDBIModalOmitted } from "./types/Components/Modal";
import * as Sharding from "discord-hybrid-sharding";
import _ from "lodash";
import {
  DBIInteractionLocale,
  TDBIInteractionLocaleOmitted,
} from "./types/other/InteractionLocale";
import { TDBIInteractions } from "./types/Interaction";
import { NamespaceData, NamespaceEnums } from "../generated/namespaceData";
import {
  DBICustomEvent,
  TDBICustomEventOmitted,
} from "./types/other/CustomEvent";
import aaq from "async-and-quick";
import {
  DBIUserSelectMenu,
  TDBIUserSelectMenuOmitted,
} from "./types/Components/UserSelectMenu";
import {
  DBIMentionableSelectMenu,
  TDBIMentionableSelectMenuOmitted,
} from "./types/Components/MentionableSelectMenu";
import {
  DBIChannelSelectMenu,
  TDBIChannelSelectMenuOmitted,
} from "./types/Components/ChannelSelectMenu";
import {
  DBIRoleSelectMenu,
  TDBIRoleSelectMenuOmitted,
} from "./types/Components/RoleSelectMenu";
import { handleMessageCommands } from "./methods/handleMessageCommands";
import { FakeMessageInteraction } from "./types/other/FakeMessageInteraction";

export interface DBIStore {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export type TDBIClientData<TNamespace extends NamespaceEnums> = {
  namespace: NamespaceData[TNamespace]["clientNamespaces"];
  token: string;
  options: Discord.ClientOptions;
  client: Discord.Client<true>;
};

export type TDBIMessageCommandsActionCtx<TNamespace extends NamespaceEnums> = {
  interaction: FakeMessageInteraction;
  dbiInteraction: DBIChatInput<TNamespace>;
  locale: { guild?: DBILocale<TNamespace>; user: DBILocale<TNamespace> };
}

export type TDBIMessageCommandsPrefixesCtx = {
  message: Discord.Message;
};

export type TDBILocaleInvalidPathCtx<TNamespace extends NamespaceEnums> = {
  path: string;
  locale: DBILocale<TNamespace>;
}

export interface DBIConfig<TNamespace extends NamespaceEnums> {
  discord: {
    namespace: string;
    token: string;
    options: Discord.ClientOptions;
  }[];
  defaults: {
    locale: {
      name: TDBILocaleString;
      invalidPath(ctx: TDBILocaleInvalidPathCtx<TNamespace>): string;
    };
    directMessages: boolean;
    defaultMemberPermissions: Discord.PermissionsString[];
    messageCommands: {
      deferReplyContent(ctx: TDBIMessageCommandsActionCtx<TNamespace>): MessagePayload | string | Promise<MessagePayload | string>;
    };
  };

  sharding: "hybrid" | "default" | "off";
  /**
   * Persist store. (Default to MemoryStore thats not persis tho.)
   */
  store: DBIStore;

  references: {
    autoClear?: {
      check: number;
      ttl: number;
    };
  };

  inlineListeners: {
    autoClear?: {
      check: number;
      ttl: number;
    };
  }

  strict: boolean;
  messageCommands?: {
    prefixes(ctx: TDBIMessageCommandsPrefixesCtx): string[] | Promise<string[]>;
    typeAliases: {
      booleans: Record<string, boolean>;
    };
  };
}

export interface DBIConfigConstructor<TNamespace extends NamespaceEnums, OtherData extends Record<string, any>> {
  discord:
  | {
    token: string;
    options: Discord.ClientOptions;
  }
  | {
    namespace: string;
    token: string;
    options: Discord.ClientOptions;
  }[];

  defaults?: {
    locale?: {
      name?: TDBILocaleString;
      invalidPath?: string | ((ctx: TDBILocaleInvalidPathCtx<TNamespace>) => string);
    };
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    messageCommands?: {
      deferReplyContent?: MessagePayload | string | ((ctx: TDBIMessageCommandsActionCtx<TNamespace>) => MessagePayload | string | Promise<MessagePayload | string>);
    };
  };

  sharding?: "hybrid" | "default" | "off";
  /**
   * Persist store. (Default to MemoryStore thats not persis tho.)
   */
  store?: DBIStore;

  references?: {
    autoClear?: {
      check: number;
      ttl: number;
    };
  };

  inlineListeners?: {
    autoClear?: {
      check: number;
      ttl: number;
    };
  };

  data?: {
    other?: OtherData;
    refs?: Map<string, { at: number; value: any; ttl?: number }>;
  };

  strict?: boolean;

  messageCommands?: {
    prefixes: string[] | ((ctx: TDBIMessageCommandsPrefixesCtx) => string[] | Promise<string[]>);
    typeAliases?: {
      /**
       * Example: {"yes": true, "no": false}
       */
      booleans?: Record<string, boolean>;
    };
  };
}

export interface DBIRegisterAPI<TNamespace extends NamespaceEnums> {
  ChatInput(cfg: TDBIChatInputOmitted<TNamespace>): DBIChatInput<TNamespace>;
  ChatInputOptions: DBIChatInputOptions<TNamespace>;
  Event(cfg: TDBIEventOmitted<TNamespace>): DBIEvent<TNamespace>;
  Locale(cfg: TDBILocaleConstructor<TNamespace>): DBILocale<TNamespace>;
  Button(cfg: TDBIButtonOmitted<TNamespace>): DBIButton<TNamespace>;
  StringSelectMenu(
    cfg: TDBIStringSelectMenuOmitted<TNamespace>
  ): DBIStringSelectMenu<TNamespace>;
  UserSelectMenu(
    cfg: TDBIUserSelectMenuOmitted<TNamespace>
  ): DBIUserSelectMenu<TNamespace>;
  RoleSelectMenu(
    cfg: TDBIRoleSelectMenuOmitted<TNamespace>
  ): DBIRoleSelectMenu<TNamespace>;
  ChannelSelectMenu(
    cfg: TDBIChannelSelectMenuOmitted<TNamespace>
  ): DBIChannelSelectMenu<TNamespace>;
  MentionableSelectMenu(
    cfg: TDBIMentionableSelectMenuOmitted<TNamespace>
  ): DBIMentionableSelectMenu<TNamespace>;
  MessageContextMenu(
    cfg: TDBIMessageContextMenuOmitted<TNamespace>
  ): DBIMessageContextMenu<TNamespace>;
  UserContextMenu(
    cfg: TDBIUserContextMenuOmitted<TNamespace>
  ): DBIUserContextMenu<TNamespace>;
  InteractionLocale(cfg: TDBIInteractionLocaleOmitted): DBIInteractionLocale;
  Modal(cfg: TDBIModalOmitted<TNamespace>): DBIModal<TNamespace>;
  CustomEvent<T extends keyof NamespaceData[TNamespace]["customEvents"]>(
    cfg: TDBICustomEventOmitted<TNamespace, T>
  ): DBICustomEvent<TNamespace, T>;

  createInlineEvent(cfg: Omit<TDBIEventOmitted<TNamespace>, "id">): DBIEvent<TNamespace>;
  createInlineButton(cfg: Omit<TDBIButtonOmitted<TNamespace>, "id" | "name">): DBIButton<TNamespace>;
  createInlineStringSelectMenu(
    cfg: Omit<TDBIStringSelectMenuOmitted<TNamespace>, "id" | "name">
  ): DBIStringSelectMenu<TNamespace>;
  createInlineUserSelectMenu(
    cfg: Omit<TDBIUserSelectMenuOmitted<TNamespace>, "id" | "name">
  ): DBIUserSelectMenu<TNamespace>;
  createInlineRoleSelectMenu(
    cfg: Omit<TDBIRoleSelectMenuOmitted<TNamespace>, "id" | "name">
  ): DBIRoleSelectMenu<TNamespace>;
  createInlineChannelSelectMenu(
    cfg: Omit<TDBIChannelSelectMenuOmitted<TNamespace>, "id" | "name">
  ): DBIChannelSelectMenu<TNamespace>;
  createInlineMentionableSelectMenu(
    cfg: Omit<TDBIMentionableSelectMenuOmitted<TNamespace>, "id" | "name">
  ): DBIMentionableSelectMenu<TNamespace>;
  createInlineModal(cfg: Omit<TDBIModalOmitted<TNamespace>, "id" | "name">): DBIModal<TNamespace>;

  onUnload(cb: () => Promise<any> | any): any;
}

export class DBI<
  TNamespace extends NamespaceEnums,
  TOtherData extends Record<string, any> = Record<string, any>
> {
  namespace: TNamespace;
  config: DBIConfig<TNamespace>;
  data: {
    interactions: Discord.Collection<string, TDBIInteractions<TNamespace>>;
    events: Discord.Collection<string, DBIEvent<TNamespace>>;
    locales: Discord.Collection<string, DBILocale<TNamespace>>;
    interactionLocales: Discord.Collection<string, DBIInteractionLocale>;
    other: TOtherData;
    eventMap: Record<string, string[] | { [k: string]: string }>;
    customEventNames: Set<string>;
    unloaders: Set<() => void>;
    registers: Set<(...args: any[]) => any>;
    registerUnloaders: Set<(...args: any[]) => any>;
    refs: Map<string, { at: number; value: any; ttl?: number }>;
    clients: TDBIClientData<TNamespace>[] & {
      next(key?: string): TDBIClientData<TNamespace>;
      random(): TDBIClientData<TNamespace>;
      random(size: number): TDBIClientData<TNamespace>[];
      first(): TDBIClientData<TNamespace>;
      get(
        namespace: NamespaceData[TNamespace]["clientNamespaces"]
      ): TDBIClientData<TNamespace>;
      indexes: Record<string, number>;
    };
  };
  events: Events<TNamespace>;
  cluster?: Sharding.ClusterClient<Discord.Client>;
  private _loaded: boolean;
  private _hooked: boolean;
  constructor(namespace: TNamespace, config: DBIConfigConstructor<TNamespace, TOtherData>) {
    this.namespace = namespace as any;
    const self = this;

    config.store = (config.store as any) || new MemoryStore();
    config.defaults = {
      locale: (() => {
        const invalidPath = config.defaults?.locale?.invalidPath;
        return {
          ...(config.defaults?.locale || {}),
          invalidPath: (typeof invalidPath === "function" ? invalidPath : (ctx: TDBILocaleInvalidPathCtx<TNamespace>) => (invalidPath || `Invalid locale path "${ctx.path}".`)) as any
        }
      })(),
      defaultMemberPermissions: [],
      directMessages: false,
      ...(config.defaults || {}),
      messageCommands: (() => {
        const deferReplyContent = config.defaults?.messageCommands?.deferReplyContent
        return {
          ...(config.defaults?.messageCommands || {}),
          deferReplyContent: (typeof deferReplyContent === "function" ? deferReplyContent : () => (deferReplyContent || "Loading...")) as any
        }
      })(),
    };

    config.sharding = config.sharding ?? "off";
    config.strict = config.strict ?? true;
    config.references = {
      autoClear: undefined,
      ...(config.references || {}),
    };
    config.inlineListeners = {
      autoClear: {
        check: 60000,
        ttl: 900000,
      },
      ...(config.inlineListeners || {}),
    };

    if (config.messageCommands) {
      const { prefixes, typeAliases } = config.messageCommands;

      if (Array.isArray(prefixes) && config.strict && !prefixes.length)
        throw new Error("No prefixes provided.");

      const prefixesFn = typeof prefixes === "function" ? prefixes : () => prefixes;

      config.messageCommands.prefixes = prefixesFn;
      config.messageCommands.typeAliases = {
        booleans: typeAliases.booleans ?? {
          true: true,
          false: false,
          yes: true,
          no: false,
          y: true,
          n: false,
          "1": true,
          "0": false,
        },
      };
    }

    // @ts-ignore
    this.config = config;

    this.data = {
      interactions: new Discord.Collection(),
      events: new Discord.Collection(),
      locales: new Discord.Collection(),
      interactionLocales: new Discord.Collection(),
      other: (config.data?.other as any) ?? ({} as TOtherData),
      eventMap: { ...eventMap },
      customEventNames: new Set(),
      unloaders: new Set(),
      registers: new Set(),
      registerUnloaders: new Set(),
      refs: config.data?.refs ?? new Map(),
      clients: Object.assign([], {
        next(key = "global") {
          this.indexes[key] = ((this.indexes[key] ?? -1) + 1) % this.length;
          return this[this.indexes[key]];
        },
        random(size?: number) {
          if (typeof size === "number") {
            return this.sort(() => Math.random() - 0.5).slice(0, size);
          } else {
            return this[Math.floor(Math.random() * this.length)];
          }
        },
        first() {
          return this[0];
        },
        get(namespace: string) {
          return this.find((i: any) => i.namespace === namespace);
        },
        indexes: {},
      }) as any,
    };

    this.events = new Events(this as any);

    config.discord = Array.isArray(config.discord)
      ? config.discord
      : [
        {
          token: config.discord.token,
          options: config.discord.options,
          namespace: "default",
        },
      ];

    this.data.clients.push(...(config.discord as any));
    for (let clientContext of this.data.clients) {
      let client = new Discord.Client({
        ...((clientContext.options || {}) as any),
        ...(config.sharding == "hybrid"
          ? {
            shards: Sharding.getInfo().SHARD_LIST,
            shardCount: Sharding.getInfo().TOTAL_SHARDS,
          }
          : {}),
      });
      clientContext.client = client as Discord.Client<true>;
    }

    if (this.data.clients.length === 0) throw new Error("No clients provided.");
    if (
      this.data.clients.length !== 1 &&
      !(config.sharding && config.sharding === "off")
    )
      throw new Error("Sharding only supports 1 client.");

    this.cluster =
      config.sharding == "hybrid"
        ? new Sharding.ClusterClient(this.data.clients[0].client)
        : undefined;
    this._loaded = false;
    this._hooked = false;
  }

  private async _hookListeners() {
    if (this._hooked) return;
    const self = this;
    this._hooked = true;
    this.data.unloaders.add(hookInteractionListeners(this as any));
    this.data.unloaders.add(hookEventListeners(this as any));
    if (typeof this.config.references.autoClear !== "undefined") {
      this.data.unloaders.add(
        (() => {
          let interval = setInterval(() => {
            this.data.refs.forEach(({ at, ttl }, key) => {
              if (
                Date.now() >
                at + (ttl || this.config.references.autoClear.ttl)
              ) {
                this.data.refs.delete(key);
              }
            });
          }, this.config.references.autoClear.check);
          return () => {
            clearInterval(interval);
          };
        })()
      );
    }
    if (typeof this.config.inlineListeners.autoClear !== "undefined") {
      this.data.unloaders.add(
        (() => {
          let interval = setInterval(() => {
            this.data.interactions.forEach((i, key) => {
              if (
                i.ttl &&
                (Date.now() >
                  i.at + (i.ttl || this.config.inlineListeners.autoClear.ttl))
              ) {
                this.data.interactions.delete(key);
              }
            });
            this.data.events.forEach((i, key) => {
              if (
                i.ttl &&
                (Date.now() >
                  i.at + (i.ttl || this.config.inlineListeners.autoClear.ttl))
              ) {
                this.data.events.delete(key);
              }
            });
          }, this.config.inlineListeners.autoClear.check);
          return () => {
            clearInterval(interval);
          };
        })()
      );
    }
    if (typeof this.config.messageCommands !== "undefined") {
      this.data.unloaders.add(
        (() => {
          const { client } = this.client();

          function onMessage(message: Discord.Message) {
            handleMessageCommands(self as any, message);
          }

          client.on("messageCreate", onMessage);
          return () => {
            client.off("messageCreate", onMessage);
          };
        })()
      );
    }
  }

  private async _unhookListeners() {
    if (!this._hooked) return;
    this._hooked = false;
    this.data.unloaders.forEach((f) => {
      f();
    });
    this.data.unloaders.clear();
  }

  private async _unregisterAll() {
    for await (const cb of this.data.registerUnloaders) {
      await cb();
    }
    this.data.events.clear();
    this.data.interactions.clear();
    this.data.interactionLocales.clear();
    this.data.locales.clear();
    this.data.registerUnloaders.clear();
    this.data.refs.clear();

    this.data.customEventNames.forEach((value) => {
      delete this.data.eventMap[value];
    });
    this.data.customEventNames.clear();
  }

  private async _registerAll(flags: string[] = []) {
    const self = this;
    const ChatInputOptions = new DBIChatInputOptions(self);

    const randomInlineId = () => `inline:${Math.random().toString(36).slice(2)}`;

    for await (const cb of this.data.registers) {
      let ChatInput = function (cfg: DBIChatInput<TNamespace>) {
        let dbiChatInput = new DBIChatInput(self, cfg);
        if (self.data.interactions.has(dbiChatInput.name))
          throw new Error(
            `DBIChatInput "${dbiChatInput.name}" already loaded as "${self.data.interactions.get(dbiChatInput.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(dbiChatInput.name, dbiChatInput);
        return dbiChatInput;
      };
      ChatInput = Object.assign(
        ChatInput,
        class {
          constructor(...args: any[]) {
            return ChatInput.apply(this, args as any);
          }
        }
      );

      let Event = function (cfg: TDBIEventOmitted<TNamespace>) {
        let dbiEvent = new DBIEvent(self as any, cfg);
        if (
          self.config.strict &&
          self.data.events.has(dbiEvent.id || dbiEvent.name)
        )
          throw new Error(
            `DBIEvent "${dbiEvent.id || dbiEvent.name}" already loaded!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.events.set(dbiEvent.id || dbiEvent.name, dbiEvent);
        return dbiEvent;
      };
      Event = Object.assign(
        Event,
        class {
          constructor(...args: any[]) {
            return Event.apply(this, args as any);
          }
        }
      );

      let createInlineEvent = function (cfg: Omit<TDBIEventOmitted<TNamespace>, "id">) {
        return Event({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id: randomInlineId() } as any);
      }

      let Button = function (cfg: TDBIButtonOmitted<TNamespace>) {
        let dbiButton = new DBIButton(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiButton.name))
          throw new Error(
            `DBIButton "${dbiButton.name}" already loaded as "${self.data.interactions.get(dbiButton.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(dbiButton.name, dbiButton as any);
        return dbiButton;
      };
      Button = Object.assign(
        Button,
        class {
          constructor(...args: any[]) {
            return Button.apply(this, args as any);
          }
        }
      );

      let createInlineButton = function (cfg: Omit<TDBIButtonOmitted<TNamespace>, "name" | "id">) {
        let id = randomInlineId();
        return Button({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let StringSelectMenu = function (
        cfg: TDBIStringSelectMenuOmitted<TNamespace>
      ) {
        let dbiStringSelectMenu = new DBIStringSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiStringSelectMenu.name)
        )
          throw new Error(
            `DBIStringSelectMenu "${dbiStringSelectMenu.name
            }" already loaded as "${self.data.interactions.get(dbiStringSelectMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiStringSelectMenu.name,
          dbiStringSelectMenu as any
        );
        return dbiStringSelectMenu;
      };
      StringSelectMenu = Object.assign(
        StringSelectMenu,
        class {
          constructor(...args: any[]) {
            return StringSelectMenu.apply(this, args as any);
          }
        }
      );

      let createInlineStringSelectMenu = function (cfg: Omit<TDBIStringSelectMenuOmitted<TNamespace>, "id" | "name">) {
        let id = randomInlineId();
        return StringSelectMenu({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let UserSelectMenu = function (
        cfg: TDBIUserSelectMenuOmitted<TNamespace>
      ) {
        let dbiUserSelectMenu = new DBIUserSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiUserSelectMenu.name)
        )
          throw new Error(
            `DBIUserSelectMenu "${dbiUserSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiUserSelectMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiUserSelectMenu.name,
          dbiUserSelectMenu as any
        );
        return dbiUserSelectMenu;
      };
      UserSelectMenu = Object.assign(
        UserSelectMenu,
        class {
          constructor(...args: any[]) {
            return UserSelectMenu.apply(this, args as any);
          }
        }
      );

      let createInlineUserSelectMenu = function (cfg: Omit<TDBIUserSelectMenuOmitted<TNamespace>, "id" | "name">) {
        let id = randomInlineId();
        return UserSelectMenu({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let RoleSelectMenu = function (
        cfg: TDBIRoleSelectMenuOmitted<TNamespace>
      ) {
        let dbiRoleSelectMenu = new DBIRoleSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiRoleSelectMenu.name)
        )
          throw new Error(
            `DBIRoleSelectMenu "${dbiRoleSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiRoleSelectMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiRoleSelectMenu.name,
          dbiRoleSelectMenu as any
        );
        return dbiRoleSelectMenu;
      };
      RoleSelectMenu = Object.assign(
        RoleSelectMenu,
        class {
          constructor(...args: any[]) {
            return RoleSelectMenu.apply(this, args as any);
          }
        }
      );

      let createInlineRoleSelectMenu = function (cfg: Omit<TDBIRoleSelectMenuOmitted<TNamespace>, "id" | "name">) {
        let id = randomInlineId();
        return RoleSelectMenu({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let ChannelSelectMenu = function (
        cfg: TDBIChannelSelectMenuOmitted<TNamespace>
      ) {
        let dbiChannelSelectMenu = new DBIChannelSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiChannelSelectMenu.name)
        )
          throw new Error(
            `DBIChannelSelectMenu "${dbiChannelSelectMenu.name
            }" already loaded as "${self.data.interactions.get(dbiChannelSelectMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiChannelSelectMenu.name,
          dbiChannelSelectMenu as any
        );
        return dbiChannelSelectMenu;
      };
      ChannelSelectMenu = Object.assign(
        ChannelSelectMenu,
        class {
          constructor(...args: any[]) {
            return ChannelSelectMenu.apply(this, args as any);
          }
        }
      );

      let createInlineChannelSelectMenu = function (cfg: Omit<TDBIChannelSelectMenuOmitted<TNamespace>, "id" | "name">) {
        let id = randomInlineId();
        return ChannelSelectMenu({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let MentionableSelectMenu = function (
        cfg: TDBIMentionableSelectMenuOmitted<TNamespace>
      ) {
        let dbiMentionableSelectMenu = new DBIMentionableSelectMenu(
          self as any,
          cfg
        );
        if (
          self.config.strict &&
          self.data.interactions.has(dbiMentionableSelectMenu.name)
        )
          throw new Error(
            `DBIMentionableSelectMenu "${dbiMentionableSelectMenu.name
            }" already loaded as "${self.data.interactions.get(dbiMentionableSelectMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiMentionableSelectMenu.name,
          dbiMentionableSelectMenu as any
        );
        return dbiMentionableSelectMenu;
      };
      MentionableSelectMenu = Object.assign(
        MentionableSelectMenu,
        class {
          constructor(...args: any[]) {
            return MentionableSelectMenu.apply(this, args as any);
          }
        }
      );

      let createInlineMentionableSelectMenu = function (cfg: Omit<TDBIMentionableSelectMenuOmitted<TNamespace>, "id" | "name">) {
        let id = randomInlineId();
        return MentionableSelectMenu({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let MessageContextMenu = function (
        cfg: TDBIMessageContextMenuOmitted<TNamespace>
      ) {
        let dbiMessageContextMenu = new DBIMessageContextMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiMessageContextMenu.name)
        )
          throw new Error(
            `DBIMessageContextMenu "${dbiMessageContextMenu.name
            }" already loaded as "${self.data.interactions.get(dbiMessageContextMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiMessageContextMenu.name,
          dbiMessageContextMenu as any
        );
        return dbiMessageContextMenu;
      };
      MessageContextMenu = Object.assign(
        MessageContextMenu,
        class {
          constructor(...args: any[]) {
            return MessageContextMenu.apply(this, args as any);
          }
        }
      );

      let UserContextMenu = function (
        cfg: TDBIUserContextMenuOmitted<TNamespace>
      ) {
        let dbiUserContextMenu = new DBIUserContextMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiUserContextMenu.name)
        )
          throw new Error(
            `DBIUserContextMenu "${dbiUserContextMenu.name
            }" already loaded as "${self.data.interactions.get(dbiUserContextMenu.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(
          dbiUserContextMenu.name,
          dbiUserContextMenu as any
        );
        return dbiUserContextMenu;
      };
      UserContextMenu = Object.assign(
        UserContextMenu,
        class {
          constructor(...args: any[]) {
            return UserContextMenu.apply(this, args as any);
          }
        }
      );

      let Modal = function (cfg: TDBIModalOmitted<TNamespace>) {
        let dbiModal = new DBIModal(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiModal.name))
          throw new Error(
            `DBIModal "${dbiModal.name}" already loaded as "${self.data.interactions.get(dbiModal.name)?.type
            }"!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactions.set(dbiModal.name, dbiModal as any);
        return dbiModal;
      };
      Modal = Object.assign(
        Modal,
        class {
          constructor(...args: any[]) {
            return Modal.apply(this, args as any);
          }
        }
      );

      let createInlineModal = function (cfg: Omit<TDBIModalOmitted<TNamespace>, "name" | "id">) {
        let id = randomInlineId();
        return Modal({ ...cfg, ttl: cfg?.ttl || self.config.inlineListeners.autoClear?.ttl, id, name: id } as any);
      }

      let Locale = function (cfg: TDBILocaleConstructor<TNamespace>) {
        let dbiLocale = new DBILocale(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactionLocales.has(dbiLocale.name)
        )
          throw new Error(`DBILocale "${dbiLocale.name}" already loaded!`);
        if (self.data.locales.has(dbiLocale.name))
          dbiLocale.mergeLocale(self.data.locales.get(dbiLocale.name));
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.locales.set(dbiLocale.name, dbiLocale);
        return dbiLocale;
      };
      Locale = Object.assign(
        Locale,
        class {
          constructor(...args: any[]) {
            return Locale.apply(this, args as any);
          }
        }
      );

      let CustomEvent = function (cfg: TDBICustomEventOmitted<TNamespace>) {
        let dbiCustomEvent = new DBICustomEvent(self, cfg) as any;
        if (self.config.strict && self.data.eventMap[dbiCustomEvent.name])
          throw new Error(
            `DBICustomEvent "${dbiCustomEvent.name}" already loaded!`
          );
        self.data.eventMap[dbiCustomEvent.name] = dbiCustomEvent.map;
        self.data.customEventNames.add(dbiCustomEvent.name);
        return dbiCustomEvent;
      };
      CustomEvent = Object.assign(
        CustomEvent,
        class {
          constructor(...args: any[]) {
            return CustomEvent.apply(this, args as any);
          }
        }
      );

      let InteractionLocale = function (cfg: TDBIInteractionLocaleOmitted) {
        let dbiInteractionLocale = new DBIInteractionLocale(self, cfg);
        if (
          self.config.strict &&
          self.data.interactionLocales.has(dbiInteractionLocale.name)
        )
          throw new Error(
            `DBIInteractionLocale "${dbiInteractionLocale.name}" already loaded!`
          );
        if (!cfg.flag || flags.includes("all") || flags.includes(cfg.flag)) self.data.interactionLocales.set(
          dbiInteractionLocale.name,
          dbiInteractionLocale
        );
        return dbiInteractionLocale;
      };
      InteractionLocale = Object.assign(
        InteractionLocale,
        class {
          constructor(...args: any[]) {
            return InteractionLocale.apply(this, args as any);
          }
        }
      );

      await cb({
        ChatInput,
        Event,
        ChatInputOptions,
        Locale,
        Button,
        StringSelectMenu,
        UserSelectMenu,
        RoleSelectMenu,
        ChannelSelectMenu,
        MentionableSelectMenu,
        MessageContextMenu,
        UserContextMenu,
        CustomEvent,
        Modal,
        InteractionLocale,
        createInlineButton,
        createInlineEvent,
        createInlineStringSelectMenu,
        createInlineUserSelectMenu,
        createInlineRoleSelectMenu,
        createInlineChannelSelectMenu,
        createInlineMentionableSelectMenu,
        createInlineModal,
        onUnload(cb: () => Promise<any> | any) {
          self.data.registerUnloaders.add(cb);
        },
      });
    }
    self.data.interactions.sort((a, b) => b.name.length - a.name.length);
  }

  emit<
    TEventName extends keyof (NamespaceData[TNamespace]["customEvents"] &
      ClientEvents)
  >(
    name: TEventName,
    args: (NamespaceData[TNamespace]["customEvents"] & ClientEvents)[TEventName]
  ): void {
    this.data.clients.forEach((d) =>
      d.client.emit(name as any, { ...args, _DIRECT_: true } as any)
    );
  }

  /**
   * this.data.interactions.get(name)
   */
  interaction<
    TInteractionName extends keyof NamespaceData[TNamespace]["interactionMapping"]
  >(
    name: TInteractionName
  ): NamespaceData[TNamespace]["interactionMapping"][TInteractionName] {
    return this.data.interactions.get(name as any) as any;
  }

  client<TClientName extends NamespaceData[TNamespace]["clientNamespaces"]>(
    name?: TClientName
  ): TDBIClientData<TNamespace> {
    return name ? this.data.clients.get(name) : this.data.clients.first();
  }
  /**
   * this.data.events.get(name)
   */
  event<TEventName extends NamespaceData[TNamespace]["eventNames"]>(
    name: TEventName
  ): DBIEvent<TNamespace> {
    return this.data.events.get(name);
  }

  /**
   * this.data.locales.get(name)
   */
  locale<TLocaleName extends NamespaceData[TNamespace]["localeNames"]>(
    name: TLocaleName
  ): DBILocale<TNamespace> {
    return this.data.locales.get(name) as any;
  }

  /**
   * Shorthands for modifying `dbi.data.other`
   */
  get<K extends keyof TOtherData>(
    k: K,
    defaultValue?: TOtherData[K]
  ): TOtherData[K] {
    if (defaultValue && !this.has(k as any)) {
      this.set(k, defaultValue);
      return defaultValue;
    }
    return _.get(this.data.other, k);
  }

  /**
   * Shorthands for modifying `dbi.data.other`
   */
  set<K extends keyof TOtherData>(k: K, v: TOtherData[K]): any {
    this.data.other = _.set(this.data.other as any, k, v);
  }

  /**
   * Shorthands for modifying `dbi.data.other`
   */
  has(k: string): boolean {
    return _.has(this.data.other, k as any);
  }

  /**
   * Shorthands for modifying `dbi.data.other`
   */
  delete(k: string): boolean {
    return _.unset(this.data.other, k);
  }

  async login(): Promise<any> {
    await aaq.quickForEach(this.data.clients, async (clientContext) => {
      await clientContext.client.login(
        this.config.sharding == "default" ? null : clientContext.token
      );
    });
    this.events.trigger("clientsReady", undefined, true);
  }

  async register(cb: (api: DBIRegisterAPI<TNamespace>) => void): Promise<any> {
    this.data.registers.add(cb);
  }

  async load(...flags: string[]): Promise<boolean> {
    if (this._loaded) return false;
    await this._registerAll(flags);
    await this._hookListeners();
    this._loaded = true;
    return true;
  }

  async unload(): Promise<boolean> {
    if (!this._loaded) return false;
    await this._unregisterAll();
    await this._unhookListeners();
    this._loaded = false;
    return true;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  async publish(type: "Global", clear?: boolean): Promise<any>;
  async publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;

  async publish(...args: any[]) {
    let interactions = this.data.interactions.filter(
      (i) =>
        i.type == "ChatInput" ||
        i.type == "MessageContextMenu" ||
        i.type == "UserContextMenu"
    ) as any;
    switch (args[0]) {
      case "Global": {
        return await publishInteractions(
          this.data.clients,
          args[1] ? new Discord.Collection() : interactions,
          this.data.interactionLocales,
          args[0]
        );
      }
      case "Guild": {
        return await publishInteractions(
          this.data.clients,
          args[2] ? new Discord.Collection() : interactions,
          this.data.interactionLocales,
          args[0],
          args[1]
        );
      }
    }
  }
}
