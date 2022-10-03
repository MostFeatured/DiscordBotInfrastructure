import { NamespaceEnums, NamespaceData } from "../generated/namespaceData";
import { DBI } from "./DBI";
import { ClientEvents } from "./types/Event";
import { IDBIBaseExecuteCtx, TDBIRateLimitTypes } from "./types/Interaction";
import { DBILocale } from "./types/Locale";
export declare type TDBIEventNames = "beforeInteraction" | "afterInteraction" | "interactionRateLimit" | "beforeEvent" | "afterEvent" | "interactionError" | "eventError";
export declare class Events<TNamespace extends NamespaceEnums> {
    DBI: DBI<TNamespace>;
    handlers: Record<string, Array<(data: any) => boolean | Promise<boolean>>>;
    constructor(DBI: DBI<TNamespace>);
    trigger(name: TDBIEventNames, data: any): Promise<boolean>;
    on(eventName: "beforeInteraction" | "afterInteraction", handler: (data: IDBIBaseExecuteCtx<TNamespace>) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    on(eventName: "interactionError", handler: (data: IDBIBaseExecuteCtx<TNamespace> & {
        error: any;
    }) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    on(eventName: "beforeEvent" | "afterEvent", handler: (data: {
        [K in keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])]: {
            other: Record<string, any>;
            locale?: {
                guild: DBILocale<TNamespace>;
            };
            eventName: K;
        } & (ClientEvents & NamespaceData[TNamespace]["customEvents"])[K];
    }[keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])]) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    on(eventName: "eventError", handler: (data: {
        [K in keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])]: {
            other: Record<string, any>;
            locale?: {
                guild: DBILocale<TNamespace>;
            };
            eventName: K;
            error: any;
        } & (ClientEvents & NamespaceData[TNamespace]["customEvents"])[K];
    }[keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])]) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    on(eventName: "interactionRateLimit", handler: (data: Omit<IDBIBaseExecuteCtx<TNamespace>, "other" | "setRateLimit"> & {
        rateLimit: {
            type: TDBIRateLimitTypes;
            duration: number;
            at: number;
        };
    }) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    off(eventName: TDBIEventNames, handler: (data: any) => Promise<boolean> | boolean): ((data: any) => boolean | Promise<boolean>)[];
}
//# sourceMappingURL=Events.d.ts.map