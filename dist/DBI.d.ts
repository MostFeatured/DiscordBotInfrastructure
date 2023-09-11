import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { ClientEvents, DBIEvent, TDBIEventOmitted } from "./types/Event";
import { Events } from "./Events";
import { DBILocale, TDBILocaleConstructor, TDBILocaleString } from "./types/other/Locale";
import { DBIButton, TDBIButtonOmitted } from "./types/Components/Button";
import { DBIStringSelectMenu, TDBIStringSelectMenuOmitted } from "./types/Components/StringSelectMenu";
import { DBIMessageContextMenu, TDBIMessageContextMenuOmitted } from "./types/other/MessageContextMenu";
import { DBIUserContextMenu, TDBIUserContextMenuOmitted } from "./types/other/UserContextMenu";
import { DBIModal, TDBIModalOmitted } from "./types/Components/Modal";
import * as Sharding from "discord-hybrid-sharding";
import { DBIInteractionLocale, TDBIInteractionLocaleOmitted } from "./types/other/InteractionLocale";
import { TDBIInteractions } from "./types/Interaction";
import { NamespaceData, NamespaceEnums } from "../generated/namespaceData";
import { DBICustomEvent, TDBICustomEventOmitted } from "./types/other/CustomEvent";
import { DBIUserSelectMenu, TDBIUserSelectMenuOmitted } from "./types/Components/UserSelectMenu";
import { DBIMentionableSelectMenu, TDBIMentionableSelectMenuOmitted } from "./types/Components/MentionableSelectMenu";
import { DBIChannelSelectMenu, TDBIChannelSelectMenuOmitted } from "./types/Components/ChannelSelectMenu";
import { DBIRoleSelectMenu, TDBIRoleSelectMenuOmitted } from "./types/Components/RoleSelectMenu";
export interface DBIStore {
    get(key: string, defaultValue?: any): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
}
export declare type DBIClientData<TNamespace extends NamespaceEnums> = {
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
}
export interface DBIConfigConstructor {
    discord: {
        token: string;
        options: Discord.ClientOptions;
    } | {
        namespace: string;
        token: string;
        options: Discord.ClientOptions;
    }[];
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
    data?: {
        other?: Record<string, any>;
        refs?: Map<string, {
            at: number;
            value: any;
            ttl?: number;
        }>;
    };
    strict?: boolean;
}
export interface DBIRegisterAPI<TNamespace extends NamespaceEnums> {
    ChatInput(cfg: TDBIChatInputOmitted<TNamespace>): DBIChatInput<TNamespace>;
    ChatInputOptions: DBIChatInputOptions<TNamespace>;
    Event(cfg: TDBIEventOmitted<TNamespace>): DBIEvent<TNamespace>;
    Locale(cfg: TDBILocaleConstructor<TNamespace>): DBILocale<TNamespace>;
    Button(cfg: TDBIButtonOmitted<TNamespace>): DBIButton<TNamespace>;
    StringSelectMenu(cfg: TDBIStringSelectMenuOmitted<TNamespace>): DBIStringSelectMenu<TNamespace>;
    UserSelectMenu(cfg: TDBIUserSelectMenuOmitted<TNamespace>): DBIUserSelectMenu<TNamespace>;
    RoleSelectMenu(cfg: TDBIRoleSelectMenuOmitted<TNamespace>): DBIRoleSelectMenu<TNamespace>;
    ChannelSelectMenu(cfg: TDBIChannelSelectMenuOmitted<TNamespace>): DBIChannelSelectMenu<TNamespace>;
    MentionableSelectMenu(cfg: TDBIMentionableSelectMenuOmitted<TNamespace>): DBIMentionableSelectMenu<TNamespace>;
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
    data: {
        interactions: Discord.Collection<string, TDBIInteractions<TNamespace>>;
        events: Discord.Collection<string, DBIEvent<TNamespace>>;
        locales: Discord.Collection<string, DBILocale<TNamespace>>;
        interactionLocales: Discord.Collection<string, DBIInteractionLocale>;
        other: TOtherData;
        eventMap: Record<string, string[] | {
            [k: string]: string;
        }>;
        customEventNames: Set<string>;
        unloaders: Set<() => void>;
        registers: Set<(...args: any[]) => any>;
        registerUnloaders: Set<(...args: any[]) => any>;
        refs: Map<string, {
            at: number;
            value: any;
            ttl?: number;
        }>;
        clients: DBIClientData<TNamespace>[] & {
            next(key?: string): DBIClientData<TNamespace>;
            random(): DBIClientData<TNamespace>;
            random(size: number): DBIClientData<TNamespace>[];
            first(): DBIClientData<TNamespace>;
            get(namespace: NamespaceData[TNamespace]["clientNamespaces"]): DBIClientData<TNamespace>;
            indexes: Record<string, number>;
        };
    };
    events: Events<TNamespace>;
    cluster?: Sharding.ClusterClient<Discord.Client>;
    private _loaded;
    private _hooked;
    constructor(namespace: TNamespace, config: DBIConfigConstructor);
    private _hookListeners;
    private _unhookListeners;
    private _unregisterAll;
    private _registerAll;
    emit<TEventName extends keyof (NamespaceData[TNamespace]["customEvents"] & ClientEvents)>(name: TEventName, args: (NamespaceData[TNamespace]["customEvents"] & ClientEvents)[TEventName]): void;
    /**
     * this.data.interactions.get(name)
     */
    interaction<TInteractionName extends keyof NamespaceData[TNamespace]["interactionMapping"]>(name: TInteractionName): NamespaceData[TNamespace]["interactionMapping"][TInteractionName];
    client<TClientName extends NamespaceData[TNamespace]["clientNamespaces"]>(name?: TClientName): DBIClientData<TNamespace>;
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