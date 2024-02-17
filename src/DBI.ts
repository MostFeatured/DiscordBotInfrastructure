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

export interface DBIStore {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export type DBIClientData<TNamespace extends NamespaceEnums> = {
  namespace: NamespaceData[TNamespace]["clientNamespaces"];
  token: string;
  options: Discord.ClientOptions;
  client: Discord.Client<true>;
};

export interface DBIConfig {
  discord: {
    namespace: string;
    token: string;
    options: Discord.ClientOptions;
  }[];
  defaults: {
    locale: TDBILocaleString;
    directMessages: boolean;
    defaultMemberPermissions: Discord.PermissionsString[];
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

  strict: boolean;
  messageCommands?: {
    prefixes: string[];
    typeAliases: {
      booleans: Record<string, boolean>;
    };
  };
}

export interface DBIConfigConstructor {
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
    locale?: TDBILocaleString;
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    messageCommands?: {
      deferReplyContent?: MessagePayload | string;
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

  data?: {
    other?: Record<string, any>;
    refs?: Map<string, { at: number; value: any; ttl?: number }>;
  };

  strict?: boolean;

  messageCommands?: {
    prefixes: string[];
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
  onUnload(cb: () => Promise<any> | any): any;
}

export class DBI<
  TNamespace extends NamespaceEnums,
  TOtherData = Record<string, any>
> {
  namespace: TNamespace;
  config: DBIConfig;
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
    clients: DBIClientData<TNamespace>[] & {
      next(key?: string): DBIClientData<TNamespace>;
      random(): DBIClientData<TNamespace>;
      random(size: number): DBIClientData<TNamespace>[];
      first(): DBIClientData<TNamespace>;
      get(
        namespace: NamespaceData[TNamespace]["clientNamespaces"]
      ): DBIClientData<TNamespace>;
      indexes: Record<string, number>;
    };
  };
  events: Events<TNamespace>;
  cluster?: Sharding.ClusterClient<Discord.Client>;
  private _loaded: boolean;
  private _hooked: boolean;
  constructor(namespace: TNamespace, config: DBIConfigConstructor) {
    this.namespace = namespace as any;
    const self = this;

    config.store = (config.store as any) || new MemoryStore();
    config.defaults = {
      locale: "en",
      defaultMemberPermissions: [],
      directMessages: false,
      ...(config.defaults || {}),
      messageCommands: {
        deferReplyContent: "Loading...",
        ...(config.defaults?.messageCommands || {}),
      },
    };
    config.sharding = config.sharding ?? "off";
    config.strict = config.strict ?? true;
    config.references = {
      autoClear: undefined,
      ...(config.references || {}),
    };

    if (config.messageCommands) {
      if (config.strict && !config.messageCommands?.prefixes?.length)
        throw new Error("No message command prefixes provided.");

      let { typeAliases } = config.messageCommands;

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
  }

  private async _unregisterAll() {
    for await (const cb of this.data.registerUnloaders) {
      await cb();
    }
    this.data.events.clear();
    this.data.interactions.clear();
    this.data.customEventNames.forEach((value) => {
      delete this.data.eventMap[value];
    });
    this.data.customEventNames.clear();
  }

  private async _registerAll() {
    const self = this;
    const ChatInputOptions = new DBIChatInputOptions(self);

    for await (const cb of this.data.registers) {
      let ChatInput = function (cfg: DBIChatInput<TNamespace>) {
        let dbiChatInput = new DBIChatInput(self, cfg);
        if (self.data.interactions.has(dbiChatInput.name))
          throw new Error(
            `DBIChatInput "${dbiChatInput.name}" already loaded as "${
              self.data.interactions.get(dbiChatInput.name)?.type
            }"!`
          );
        self.data.interactions.set(dbiChatInput.name, dbiChatInput);
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
        self.data.events.set(dbiEvent.id || dbiEvent.name, dbiEvent);
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

      let Button = function (cfg: TDBIButtonOmitted<TNamespace>) {
        let dbiButton = new DBIButton(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiButton.name))
          throw new Error(
            `DBIButton "${dbiButton.name}" already loaded as "${
              self.data.interactions.get(dbiButton.name)?.type
            }"!`
          );
        self.data.interactions.set(dbiButton.name, dbiButton as any);
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

      let StringSelectMenu = function (
        cfg: TDBIStringSelectMenuOmitted<TNamespace>
      ) {
        let dbiStringSelectMenu = new DBIStringSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiStringSelectMenu.name)
        )
          throw new Error(
            `DBIStringSelectMenu "${
              dbiStringSelectMenu.name
            }" already loaded as "${
              self.data.interactions.get(dbiStringSelectMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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

      let UserSelectMenu = function (
        cfg: TDBIUserSelectMenuOmitted<TNamespace>
      ) {
        let dbiUserSelectMenu = new DBIUserSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiUserSelectMenu.name)
        )
          throw new Error(
            `DBIUserSelectMenu "${dbiUserSelectMenu.name}" already loaded as "${
              self.data.interactions.get(dbiUserSelectMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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

      let RoleSelectMenu = function (
        cfg: TDBIRoleSelectMenuOmitted<TNamespace>
      ) {
        let dbiRoleSelectMenu = new DBIRoleSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiRoleSelectMenu.name)
        )
          throw new Error(
            `DBIRoleSelectMenu "${dbiRoleSelectMenu.name}" already loaded as "${
              self.data.interactions.get(dbiRoleSelectMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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

      let ChannelSelectMenu = function (
        cfg: TDBIChannelSelectMenuOmitted<TNamespace>
      ) {
        let dbiChannelSelectMenu = new DBIChannelSelectMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiChannelSelectMenu.name)
        )
          throw new Error(
            `DBIChannelSelectMenu "${
              dbiChannelSelectMenu.name
            }" already loaded as "${
              self.data.interactions.get(dbiChannelSelectMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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
            `DBIMentionableSelectMenu "${
              dbiMentionableSelectMenu.name
            }" already loaded as "${
              self.data.interactions.get(dbiMentionableSelectMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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

      let MessageContextMenu = function (
        cfg: TDBIMessageContextMenuOmitted<TNamespace>
      ) {
        let dbiMessageContextMenu = new DBIMessageContextMenu(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactions.has(dbiMessageContextMenu.name)
        )
          throw new Error(
            `DBIMessageContextMenu "${
              dbiMessageContextMenu.name
            }" already loaded as "${
              self.data.interactions.get(dbiMessageContextMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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
            `DBIUserContextMenu "${
              dbiUserContextMenu.name
            }" already loaded as "${
              self.data.interactions.get(dbiUserContextMenu.name)?.type
            }"!`
          );
        self.data.interactions.set(
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
            `DBIModal "${dbiModal.name}" already loaded as "${
              self.data.interactions.get(dbiModal.name)?.type
            }"!`
          );
        self.data.interactions.set(dbiModal.name, dbiModal as any);
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

      let Locale = function (cfg: TDBILocaleConstructor<TNamespace>) {
        let dbiLocale = new DBILocale(self as any, cfg);
        if (
          self.config.strict &&
          self.data.interactionLocales.has(dbiLocale.name)
        )
          throw new Error(`DBILocale "${dbiLocale.name}" already loaded!`);
        if (self.data.locales.has(dbiLocale.name))
          dbiLocale.mergeLocale(self.data.locales.get(dbiLocale.name));
        self.data.locales.set(dbiLocale.name, dbiLocale);
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
        self.data.interactionLocales.set(
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
  ): DBIClientData<TNamespace> {
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
  }

  async register(cb: (api: DBIRegisterAPI<TNamespace>) => void): Promise<any> {
    this.data.registers.add(cb);
  }

  async load(): Promise<boolean> {
    if (this._loaded) return false;
    await this._registerAll();
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
        i.publishType != "None" &&
        (i.publishType == args[0] || i.publishType == null) &&
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
