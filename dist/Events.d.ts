import { NamespaceEnums } from "../generated/namespaceData";
import { DBI } from "./DBI";
import { IDBIBaseExecuteCtx, TDBIRateLimitTypes } from "./types/Interaction";
import { DBILocale } from "./types/Locale";
export declare type TDBIEventNames = "beforeInteraction" | "afterInteraction" | "interactionRateLimit" | "beforeEvent" | "afterEvent";
export declare class Events<TNamespace extends NamespaceEnums> {
    DBI: DBI<TNamespace>;
    handlers: Record<string, Array<(data: any) => boolean | Promise<boolean>>>;
    constructor(DBI: DBI<TNamespace>);
    trigger(name: TDBIEventNames, data: any): Promise<boolean>;
    on(eventName: "beforeInteraction" | "afterInteraction", handler: (data: IDBIBaseExecuteCtx<TNamespace>) => Promise<boolean> | boolean, options?: {
        once: boolean;
    }): (() => any);
    on(eventName: "beforeEvent" | "afterEvent", handler: (data: {
        [key: string]: any;
        other: Record<string, any>;
        locale?: {
            guild: DBILocale<TNamespace>;
        };
        eventName: string;
    }) => Promise<boolean> | boolean, options?: {
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
    off(eventName: TDBIEventNames, handler: (data: any) => Promise<boolean> | boolean): void;
}
//# sourceMappingURL=Events.d.ts.map