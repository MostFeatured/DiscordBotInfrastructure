import { NamespaceEnums } from "../generated/namespaceData";
import { DBI } from "./DBI";
import { ClientEvents } from "./types/Event";
import { IDBIBaseExecuteCtx, TDBIRateLimitTypes } from "./types/Interaction";
import { DBILocale } from "./types/Locale";

export type TDBIEventNames = "beforeInteraction" | "afterInteraction" | "interactionRateLimit" | "beforeEvent" | "afterEvent";

export class Events<TNamespace extends NamespaceEnums> {
  DBI: DBI<TNamespace>;
  handlers: Record<string, Array<(data: any) => boolean | Promise<boolean>>>;
  constructor(DBI: DBI<TNamespace>) {
    this.DBI = DBI;

    this.handlers = {
      beforeInteraction: [],
      afterInteraction: [],
      interactionRateLimit: [],
      beforeEvent: [],
      afterEvent: []
    }
  }
  
  async trigger(name: TDBIEventNames, data: any): Promise<boolean> {
    let handlers = this.handlers[name];
    if (!handlers) return true;
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      let returned = await handler(data);
      if (returned !== true) return false;
    }
    return true;
  }


  on(
    eventName: "beforeInteraction" | "afterInteraction",
    handler: (data: IDBIBaseExecuteCtx<TNamespace>) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(
    eventName: "beforeEvent" | "afterEvent",
    handler: (data: {
      [K in keyof ClientEvents]: { other: Record<string, any>, locale?: { guild: DBILocale<TNamespace> }, eventName: K } & ClientEvents[K]
    }[keyof ClientEvents]) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(
    eventName: "interactionRateLimit",
    handler: (data: Omit<IDBIBaseExecuteCtx<TNamespace>, "other" | "setRateLimit"> & { rateLimit: { type: TDBIRateLimitTypes, duration: number, at: number } }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(eventName: TDBIEventNames, handler: (data: any) => Promise<boolean> | boolean, options: { once: boolean } = { once: false }): (() => any) {
    if (!this.handlers.hasOwnProperty(eventName)) this.handlers[eventName] = [];
    if (options.once) {
      let h = (data) => {
        this.off(eventName, h);
        return handler(data);
      };
      this.on(eventName as any, h as any, { once: false });
      return () => {
        this.off(eventName, h);
      }
    } else {
      this.handlers[eventName].push(handler);
      return () => {
        this.off(eventName, handler);
      }
    }
  }

  off(eventName: TDBIEventNames, handler: (data: any) => Promise<boolean> | boolean) {
    let l = this.handlers[eventName];
    if (!l) return [];
    return l.splice(l.indexOf(handler), 1);
  }
}