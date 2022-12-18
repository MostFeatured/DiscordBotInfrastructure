import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { publishInteractions } from "./methods/publishInteractions";
import { ClientEvents, DBIEvent, TDBIEventOmitted } from "./types/Event";
import { MemoryStore } from "./utils/MemoryStore";
import { hookInteractionListeners } from "./methods/hookInteractionListeners";
import { Events } from "./Events";
import { DBILocale, TDBILocaleConstructor, TDBILocaleString } from "./types/Locale";
import { DBIButton, TDBIButtonOmitted } from "./types/Button";
import { DBISelectMenu, TDBISelectMenuOmitted } from "./types/SelectMenu";
import { DBIMessageContextMenu, TDBIMessageContextMenuOmitted } from "./types/MessageContextMenu";
import { DBIUserContextMenu, TDBIUserContextMenuOmitted } from "./types/UserContextMenu";
import { hookEventListeners } from "./methods/hookEventListeners";
import eventMap from "./data/eventMap.json";
import { DBIModal, TDBIModalOmitted } from "./types/Modal";
import * as Sharding from "discord-hybrid-sharding";
import _ from "lodash";
import { DBIInteractionLocale, TDBIInteractionLocaleOmitted } from "./types/InteractionLocale";
import { TDBIInteractions } from "./types/Interaction";
import { NamespaceData, NamespaceEnums } from "../generated/namespaceData";
import { DBICustomEvent, TDBICustomEventOmitted } from "./types/CustomEvent";
import aaq from "async-and-quick";

export interface DBIStore {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export type DBIClientData<TNamespace extends NamespaceEnums> = { namespace: NamespaceData[TNamespace]["clientNamespaces"], token: string, options: Discord.Options, client: Discord.Client<true> };

export interface DBIConfig {
  discord: {
    token: string;
    options: Discord.ClientOptions
  }
  defaults: {
    locale: TDBILocaleString,
    directMessages: boolean,
    defaultMemberPermissions: Discord.PermissionsString[]
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
    }
  };

  strict: boolean;
}

export interface DBIConfigConstructor {
  discord: {
    token: string;
    options: Discord.ClientOptions
  } | {
    namespace: string,
    token: string,
    options: Discord.ClientOptions,
  }[];

  defaults?: {
    locale?: TDBILocaleString,
    directMessages?: boolean,
    defaultMemberPermissions?: Discord.PermissionsString[]
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
    }
  };

  data?: {
    other?: Record<string, any>;
    refs?: Map<string, { at: number, value: any, ttl?: number }>;
  }

  strict?: boolean;
}

export interface DBIRegisterAPI<TNamespace extends NamespaceEnums> {
  ChatInput(cfg: TDBIChatInputOmitted<TNamespace>): DBIChatInput<TNamespace>;
  ChatInputOptions: DBIChatInputOptions<TNamespace>;
  Event(cfg: TDBIEventOmitted<TNamespace>): DBIEvent<TNamespace>;
  Locale(cfg: TDBILocaleConstructor<TNamespace>): DBILocale<TNamespace>;
  Button(cfg: TDBIButtonOmitted<TNamespace>): DBIButton<TNamespace>;
  SelectMenu(cfg: TDBISelectMenuOmitted<TNamespace>): DBISelectMenu<TNamespace>;
  MessageContextMenu(cfg: TDBIMessageContextMenuOmitted<TNamespace>): DBIMessageContextMenu<TNamespace>;
  UserContextMenu(cfg: TDBIUserContextMenuOmitted<TNamespace>): DBIUserContextMenu<TNamespace>;
  InteractionLocale(cfg: TDBIInteractionLocaleOmitted): DBIInteractionLocale;
  Modal(cfg: TDBIModalOmitted<TNamespace>): DBIModal<TNamespace>;
  CustomEvent<T extends keyof NamespaceData[TNamespace]["customEvents"]>(cfg: TDBICustomEventOmitted<TNamespace, T>): DBICustomEvent<TNamespace, T>;
  onUnload(cb: () => Promise<any> | any): any;
}

export class DBI<TNamespace extends NamespaceEnums, TOtherData = Record<string, any>> {
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
    refs: Map<string, { at: number, value: any, ttl?: number }>;
    clients:
    & DBIClientData<TNamespace>[]
    & {
      next(key?: string): DBIClientData<TNamespace>,
      random(): DBIClientData<TNamespace>,
      first(): DBIClientData<TNamespace>,
      get(namespace: NamespaceData[TNamespace]["clientNamespaces"]): DBIClientData<TNamespace>,
      indexes: Record<string, number>
    }
  };
  events: Events<TNamespace>;
  cluster?: Sharding.Client;
  private _loaded: boolean;
  private _hooked: boolean;
  constructor(namespace: TNamespace, config: DBIConfigConstructor) {
    this.namespace = namespace as any;
    const self = this;

    config.store = config.store as any || new MemoryStore();
    config.defaults = {
      locale: "en",
      defaultMemberPermissions: [],
      directMessages: false,
      ...(config.defaults || {})
    };
    config.sharding = config.sharding ?? "off";
    config.strict = config.strict ?? true;
    config.references = {
      autoClear: undefined,
      ...(config.references || {})
    }

    // @ts-ignore
    this.config = config;

    this.data = {
      interactions: new Discord.Collection(),
      events: new Discord.Collection(),
      locales: new Discord.Collection(),
      interactionLocales: new Discord.Collection(),
      other: (config.data?.other as any) ?? ({} as TOtherData),
      eventMap,
      customEventNames: new Set(),
      unloaders: new Set(),
      registers: new Set(),
      registerUnloaders: new Set(),
      refs: config.data?.refs ?? new Map(),
      clients: Object.assign([], {
        next(key = "global") {
          this.indexes[key] = (((this.indexes[key] ?? -1) + 1) % this.length);
          return this[this.indexes[key]];
        },
        random() {
          return this[Math.floor(Math.random() * this.length)];
        },
        first() {
          return this[0];
        },
        get(namespace: string) {
          return this.find((i: any) => i.namespace === namespace);
        },
        indexes: {}
      }) as any
    }

    this.events = new Events(this as any);

    this.data.clients.push(...(
      (
        Array.isArray(config.discord) ?
          config.discord :
          [{ token: config.discord.token, options: config.discord.options, namespace: "default" }]
      ) as any
    ));
    for (let clientContext of this.data.clients) {
      let client = new Discord.Client({
        ...(clientContext.options || {}) as any,
        ...(config.sharding == "hybrid" ? {
          shards: (Sharding as any).data.SHARD_LIST,
          shardCount: (Sharding as any).data.TOTAL_SHARDS
        } : {})
      });
      clientContext.client = client;
    }

    if (this.data.clients.length === 0) throw new Error("No clients provided.");
    if (this.data.clients.length !== 1 && !(config.sharding && config.sharding === "off"))
      throw new Error("Sharding only supports 1 client.");

    this.cluster = config.sharding == "hybrid" ? new Sharding.Client(this.data.clients[0].client) : undefined;
    this._loaded = false;
    this._hooked = false;
  }

  private async _hookListeners() {
    if (this._hooked) return;
    this._hooked = true;
    this.data.unloaders.add(hookInteractionListeners(this as any));
    this.data.unloaders.add(hookEventListeners(this as any));
    if (typeof this.config.references.autoClear != "undefined") {
      this.data.unloaders.add((() => {
        let interval = setInterval(() => {
          this.data.refs.forEach(({ at, ttl }, key) => {
            if (Date.now() > (at + (ttl || this.config.references.autoClear.ttl))) {
              this.data.refs.delete(key);
            }
          });
        }, this.config.references.autoClear.check);
        return () => {
          clearInterval(interval);
        }
      })());
    }
  }

  private async _unhookListeners() {
    if (!this._hooked) return;
    this._hooked = false;
    this.data.unloaders.forEach(f => {
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
        if (self.data.interactions.has(dbiChatInput.name)) throw new Error(`DBIChatInput "${dbiChatInput.name}" already loaded as "${self.data.interactions.get(dbiChatInput.name)?.type}"!`);
        self.data.interactions.set(dbiChatInput.name, dbiChatInput);
        return dbiChatInput;
      };
      ChatInput = Object.assign(ChatInput, class { constructor(...args: any[]) { return ChatInput.apply(this, args as any); } });

      let Event = function (cfg: TDBIEventOmitted<TNamespace>) {
        let dbiEvent = new DBIEvent(self as any, cfg);
        if (self.config.strict && self.data.events.has(dbiEvent.id || dbiEvent.name)) throw new Error(`DBIEvent "${dbiEvent.id || dbiEvent.name}" already loaded!`);
        self.data.events.set(dbiEvent.id || dbiEvent.name, dbiEvent);
        return dbiEvent;
      };
      Event = Object.assign(Event, class { constructor(...args: any[]) { return Event.apply(this, args as any); } });

      let Button = function (cfg: TDBIButtonOmitted<TNamespace>) {
        let dbiButton = new DBIButton(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiButton.name)) throw new Error(`DBIButton "${dbiButton.name}" already loaded as "${self.data.interactions.get(dbiButton.name)?.type}"!`);
        self.data.interactions.set(dbiButton.name, dbiButton as any);
        return dbiButton;
      };
      Button = Object.assign(Button, class { constructor(...args: any[]) { return Button.apply(this, args as any); } });

      let SelectMenu = function (cfg: TDBISelectMenuOmitted<TNamespace>) {
        let dbiSelectMenu = new DBISelectMenu(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiSelectMenu.name)) throw new Error(`DBISelectMenu "${dbiSelectMenu.name}" already loaded as "${self.data.interactions.get(dbiSelectMenu.name)?.type}"!`);
        self.data.interactions.set(dbiSelectMenu.name, dbiSelectMenu as any);
        return dbiSelectMenu;
      };
      SelectMenu = Object.assign(SelectMenu, class { constructor(...args: any[]) { return SelectMenu.apply(this, args as any); } });

      let MessageContextMenu = function (cfg: TDBIMessageContextMenuOmitted<TNamespace>) {
        let dbiMessageContextMenu = new DBIMessageContextMenu(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiMessageContextMenu.name)) throw new Error(`DBIMessageContextMenu "${dbiMessageContextMenu.name}" already loaded as "${self.data.interactions.get(dbiMessageContextMenu.name)?.type}"!`);
        self.data.interactions.set(dbiMessageContextMenu.name, dbiMessageContextMenu as any);
        return dbiMessageContextMenu;
      };
      MessageContextMenu = Object.assign(MessageContextMenu, class { constructor(...args: any[]) { return MessageContextMenu.apply(this, args as any); } });

      let UserContextMenu = function (cfg: TDBIUserContextMenuOmitted<TNamespace>) {
        let dbiUserContextMenu = new DBIUserContextMenu(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiUserContextMenu.name)) throw new Error(`DBIUserContextMenu "${dbiUserContextMenu.name}" already loaded as "${self.data.interactions.get(dbiUserContextMenu.name)?.type}"!`);
        self.data.interactions.set(dbiUserContextMenu.name, dbiUserContextMenu as any);
        return dbiUserContextMenu;
      };
      UserContextMenu = Object.assign(UserContextMenu, class { constructor(...args: any[]) { return UserContextMenu.apply(this, args as any); } });

      let Modal = function (cfg: TDBIModalOmitted<TNamespace>) {
        let dbiModal = new DBIModal(self as any, cfg);
        if (self.config.strict && self.data.interactions.has(dbiModal.name)) throw new Error(`DBIModal "${dbiModal.name}" already loaded as "${self.data.interactions.get(dbiModal.name)?.type}"!`);
        self.data.interactions.set(dbiModal.name, dbiModal as any);
        return dbiModal;
      };
      Modal = Object.assign(Modal, class { constructor(...args: any[]) { return Modal.apply(this, args as any); } });

      let Locale = function (cfg: TDBILocaleConstructor<TNamespace>) {
        let dbiLocale = new DBILocale(self as any, cfg);
        if (self.config.strict && self.data.interactionLocales.has(dbiLocale.name)) throw new Error(`DBILocale "${dbiLocale.name}" already loaded!`);
        if (self.data.locales.has(dbiLocale.name)) dbiLocale.mergeLocale(self.data.locales.get(dbiLocale.name));
        self.data.locales.set(dbiLocale.name, dbiLocale);
        return dbiLocale;
      };
      Locale = Object.assign(Locale, class { constructor(...args: any[]) { return Locale.apply(this, args as any); } });

      let CustomEvent = function (cfg: TDBICustomEventOmitted<TNamespace>) {
        let dbiCustomEvent = new DBICustomEvent(self, cfg) as any;
        if (self.config.strict && self.data.eventMap[dbiCustomEvent.name]) throw new Error(`DBICustomEvent "${dbiCustomEvent.name}" already loaded!`);
        self.data.eventMap[dbiCustomEvent.name] = dbiCustomEvent.map;
        self.data.customEventNames.add(dbiCustomEvent.name);
        return dbiCustomEvent;
      };
      CustomEvent = Object.assign(CustomEvent, class { constructor(...args: any[]) { return CustomEvent.apply(this, args as any); } });

      let InteractionLocale = function (cfg: TDBIInteractionLocaleOmitted) {
        let dbiInteractionLocale = new DBIInteractionLocale(self, cfg);
        if (self.config.strict && self.data.interactionLocales.has(dbiInteractionLocale.name)) throw new Error(`DBIInteractionLocale "${dbiInteractionLocale.name}" already loaded!`);
        self.data.interactionLocales.set(dbiInteractionLocale.name, dbiInteractionLocale);
        return dbiInteractionLocale;
      };
      InteractionLocale = Object.assign(InteractionLocale, class { constructor(...args: any[]) { return InteractionLocale.apply(this, args as any); } });

      await cb({
        ChatInput,
        Event,
        ChatInputOptions,
        Locale,
        Button,
        SelectMenu,
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
  }

  /**
   * this.data.interactions.get(name)
   */
  interaction<TInteractionName extends keyof NamespaceData[TNamespace]["interactionMapping"]>(name: TInteractionName): NamespaceData[TNamespace]["interactionMapping"][TInteractionName] {
    return this.data.interactions.get(name as any) as any;
  }

  emit<TEventName extends keyof (NamespaceData[TNamespace]["customEvents"] & ClientEvents)>(name: TEventName, args: (NamespaceData[TNamespace]["customEvents"] & ClientEvents)[TEventName]): void {
    this.data.clients.forEach((d) => d.client.emit(name as any, { ...args, _DIRECT_: true } as any));
  }

  /**
   * @deprecated
   */
  get client() {
    console.log("[DEPRECTED] dbi.client is a deprected api. Please use dbi.data.clients.first().client instead.", Error().stack);
    return this.data.clients[0]?.client;
  }
  /**
   * this.data.events.get(name)
   */
  event<TEventName extends NamespaceData[TNamespace]["eventNames"]>(name: TEventName): DBIEvent<TNamespace> {
    return this.data.events.get(name);
  }

  /**
   * this.data.locales.get(name)
   */
  locale<TLocaleName extends NamespaceData[TNamespace]["localeNames"]>(name: TLocaleName): DBILocale<TNamespace> {
    return this.data.locales.get(name) as any;
  }

  /**
   * Shorthands for modifying `dbi.data.other`
   */
  get<K extends keyof TOtherData>(k: K, defaultValue?: TOtherData[K]): TOtherData[K] {
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
      await clientContext.client.login(this.config.sharding == "default" ? null : clientContext.token);
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
    let interactions = this.data.interactions.filter(i => i.type == "ChatInput" || i.type == "MessageContextMenu" || i.type == "UserContextMenu") as any;
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