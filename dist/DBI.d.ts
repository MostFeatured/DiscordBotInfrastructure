import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { ClientEvents, DBIEvent, TDBIEventOmitted } from "./types/Event";
import { Events } from "./Events";
import { DBILocale, TDBILocaleConstructor, TDBILocaleString } from "./types/Locale";
import { DBIButton, TDBIButtonOmitted } from "./types/Button";
import { DBISelectMenu, TDBISelectMenuOmitted } from "./types/SelectMenu";
import { DBIMessageContextMenu, TDBIMessageContextMenuOmitted } from "./types/MessageContextMenu";
import { DBIUserContextMenu, TDBIUserContextMenuOmitted } from "./types/UserContextMenu";
import { DBIModal, TDBIModalOmitted } from "./types/Modal";
import * as Sharding from "discord-hybrid-sharding";
import { DBIInteractionLocale, TDBIInteractionLocaleOmitted } from "./types/InteractionLocale";
import { TDBIInteractions } from "./types/Interaction";
import { NamespaceData, NamespaceEnums } from "../generated/namespaceData";
import { DBICustomEvent, TDBICustomEventOmitted } from "./types/CustomEvent";
export interface DBIStore {
    get(key: string, defaultValue?: any): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
}
export interface DBIConfig {
    discord: {
        token: string;
        options: Discord.ClientOptions;
    };
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
}
export interface DBIConfigConstructor {
    discord: {
        token: string;
        options: Discord.ClientOptions;
    };
    defaults?: {
        locale?: TDBILocaleString;
        directMessages?: boolean;
        defaultMemberPermissions?: Discord.PermissionsString[];
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
export declare class DBI<TNamespace extends NamespaceEnums, TOtherData = Record<string, any>> {
    namespace: TNamespace;
    config: DBIConfig;
    client: Discord.Client<true>;
    data: {
        interactions: Discord.Collection<string, TDBIInteractions<TNamespace>>;
        events: Discord.Collection<string, DBIEvent<TNamespace>>;
        locales: Discord.Collection<string, DBILocale<TNamespace>>;
        interactionLocales: Discord.Collection<string, DBIInteractionLocale>;
        other: TOtherData;
        eventMap: Record<string, string[]>;
        customEventNames: Set<string>;
        unloaders: Set<() => void>;
        registers: Set<(...args: any[]) => any>;
        registerUnloaders: Set<(...args: any[]) => any>;
        refs: Map<string, {
            at: number;
            value: any;
            ttl?: number;
        }>;
    };
    events: Events<TNamespace>;
    cluster?: Sharding.Client;
    private _loaded;
    private _hooked;
    constructor(namespace: TNamespace, config: DBIConfigConstructor);
    private _hookListeners;
    private _unhookListeners;
    private _unregisterAll;
    private _registerAll;
    /**
     * this.data.interactions.get(name)
     */
    interaction<TInteractionName extends keyof NamespaceData[TNamespace]["interactionMapping"]>(name: TInteractionName): NamespaceData[TNamespace]["interactionMapping"][TInteractionName];
    emit<TEventName extends keyof (NamespaceData[TNamespace]["customEvents"] & ClientEvents)>(name: TEventName, args: (NamespaceData[TNamespace]["customEvents"] & ClientEvents)[TEventName]): void;
    /**
     *
     * ((NamespaceData[TNamespace]["customEvents"] & ClientEvents)[K] as const)
     * typeof ((NamespaceData[TNamespace]["customEvents"] & ClientEvents)[K])[keyof typeof ((NamespaceData[TNamespace]["customEvents"] & ClientEvents)[K])]
     */
    /**
     * this.data.events.get(name)
     */
    event<TEventName extends NamespaceData[TNamespace]["eventNames"]>(name: TEventName): DBIEvent<TNamespace>;
    /**
     * this.data.locales.get(name)
     */
    locale<TLocaleName extends NamespaceData[TNamespace]["localeNames"]>(name: TLocaleName): DBILocale<TNamespace>;
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    get<K extends keyof TOtherData>(k: K, defaultValue?: TOtherData[K]): TOtherData[K];
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    set<K extends keyof TOtherData>(k: K, v: TOtherData[K]): any;
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    has(k: string): boolean;
    /**
     * Shorthands for modifying `dbi.data.other`
     */
    delete(k: string): boolean;
    login(): Promise<any>;
    register(cb: (api: DBIRegisterAPI<TNamespace>) => void): Promise<any>;
    load(): Promise<boolean>;
    unload(): Promise<boolean>;
    get loaded(): boolean;
    publish(type: "Global", clear?: boolean): Promise<any>;
    publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;
}
//# sourceMappingURL=DBI.d.ts.map