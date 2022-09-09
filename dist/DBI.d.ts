import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { DBIEvent, TDBIEventOmitted } from "./types/Event";
import { Events } from "./Events";
import { DBILocale, TDBILocaleConstructor, TDBILocaleString } from "./types/Locale";
import { DBIButton, TDBIButtonOmitted } from "./types/Button";
import { DBISelectMenu, TDBISelectMenuOmitted } from "./types/SelectMenu";
import { DBIMessageContextMenu, TDBIMessageContextMenuOmitted } from "./types/MessageContextMenu";
import { DBIUserContextMenu, TDBIUserContextMenuOmitted } from "./types/UserContextMenu";
import { DBIModal, TDBIModalOmitted } from "./types/Modal";
import * as Sharding from "discord-hybrid-sharding";
import { DBIInteractionLocale, TDBIInteractionLocaleOmitted } from "./types/InteractionLocale";
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
    sharding: boolean;
    /**
     * Persist store. (Default to MemoryStore thats not persis tho.)
     */
    store: DBIStore;
    clearRefsAfter?: number;
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
    sharding?: boolean;
    /**
     * Persist store. (Default to MemoryStore thats not persis tho.)
     */
    store?: DBIStore;
    clearRefsAfter?: number;
}
export interface DBIRegisterAPI {
    ChatInput(cfg: TDBIChatInputOmitted): DBIChatInput;
    ChatInputOptions: typeof DBIChatInputOptions;
    Event(cfg: TDBIEventOmitted): DBIEvent;
    Locale(cfg: TDBILocaleConstructor): DBILocale;
    Button(cfg: TDBIButtonOmitted): DBIButton;
    SelectMenu(cfg: TDBISelectMenuOmitted): DBISelectMenu;
    MessageContextMenu(cfg: TDBIMessageContextMenuOmitted): DBIMessageContextMenu;
    UserContextMenu(cfg: TDBIUserContextMenuOmitted): DBIUserContextMenu;
    InteractionLocale(cfg: TDBIInteractionLocaleOmitted): DBIInteractionLocale;
    Modal(cfg: TDBIModalOmitted): DBIModal;
    onUnload(cb: () => Promise<any> | any): any;
}
export declare class DBI<TOtherData = Record<string, any>> {
    namespace: string;
    config: DBIConfig;
    client: Discord.Client<true>;
    data: {
        interactions: Discord.Collection<string, DBIChatInput | DBIButton | DBISelectMenu | DBIMessageContextMenu | DBIUserContextMenu | DBIModal>;
        events: Discord.Collection<string, DBIEvent>;
        plugins: Discord.Collection<string, any>;
        locales: Discord.Collection<string, DBILocale>;
        interactionLocales: Discord.Collection<string, DBIInteractionLocale>;
        other: TOtherData;
        eventMap: Record<string, string[]>;
        unloaders: Set<() => void>;
        registers: Set<(...args: any[]) => any>;
        registerUnloaders: Set<(...args: any[]) => any>;
        refs: Map<string, {
            at: number;
            value: any;
        }>;
    };
    events: Events;
    cluster?: Sharding.Client;
    private _loaded;
    private _hooked;
    constructor(namespace: string, config: DBIConfigConstructor);
    private _hookListeners;
    private _unhookListeners;
    private _unregisterAll;
    private _registerAll;
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
    register(cb: (api: DBIRegisterAPI) => void): Promise<any>;
    load(): Promise<boolean>;
    unload(): Promise<boolean>;
    get loaded(): boolean;
    publish(type: "Global", clear?: boolean): Promise<any>;
    publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;
}
//# sourceMappingURL=DBI.d.ts.map