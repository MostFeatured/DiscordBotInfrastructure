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
export interface DBIStore {
    get(key: string, defaultValue?: any): Promise<any>;
    set(key: string, value: any): Promise<void>;
    del(key: string): Promise<void>;
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
    store: DBIStore;
}
export declare type TDBIConfigConstructor = Partial<DBIConfig>;
export interface DBIRegisterAPI {
    ChatInput(cfg: TDBIChatInputOmitted): DBIChatInput;
    ChatInputOptions: typeof DBIChatInputOptions;
    Event(cfg: TDBIEventOmitted): DBIEvent;
    Locale(cfg: TDBILocaleConstructor): DBILocale;
    Button(cfg: TDBIButtonOmitted): DBIButton;
    SelectMenu(cfg: TDBISelectMenuOmitted): DBISelectMenu;
    MessageContextMenu(cfg: TDBIMessageContextMenuOmitted): DBIMessageContextMenu;
    UserContextMenu(cfg: TDBIUserContextMenuOmitted): DBIUserContextMenu;
    Modal(cfg: TDBIModalOmitted): DBIModal;
    onUnload(cb: () => Promise<any> | any): any;
}
export declare class DBI {
    namespace: string;
    config: DBIConfig;
    client: Discord.Client<true>;
    data: {
        interactions: Discord.Collection<string, DBIChatInput | DBIButton | DBISelectMenu | DBIMessageContextMenu | DBIUserContextMenu | DBIModal>;
        events: Discord.Collection<string, DBIEvent>;
        plugins: Discord.Collection<string, any>;
        locales: Discord.Collection<string, DBILocale>;
        other: Record<string, any>;
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
    constructor(namespace: string, config: TDBIConfigConstructor);
    private _hookListeners;
    private _unregisterAll;
    private _registerAll;
    login(): Promise<any>;
    register(cb: (api: DBIRegisterAPI) => void): Promise<any>;
    load(): Promise<boolean>;
    unload(): Promise<boolean>;
    get loaded(): boolean;
    publish(type: "Global", clear?: boolean): Promise<any>;
    publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;
}
//# sourceMappingURL=DBI.d.ts.map