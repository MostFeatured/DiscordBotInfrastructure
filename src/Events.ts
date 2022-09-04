import { DBI } from "./DBI";
import { IDBIBaseExecuteCtx, TDBIRateLimitTypes } from "./types/Interaction";

export type TDBIEventNames = "beforeInteraction" | "afterInteraction" | "interactionRateLimit" | "beforeEvent" | "afterEvent";

export class Events {
  DBI: DBI;
  handlers: Record<string, Array<(data: any) => boolean | Promise<boolean>>>;
  constructor(DBI: DBI) {
    this.DBI = DBI;

    this.handlers = {
      beforeInteraction: [],
      afterInteraction: [],
      interactionRateLimit: [],
      beforeEvent: [],
      afterEvent: []
    }
  }
  
  async trigger(name: TDBIEventNames, data: any): Promise<boolean>{
    let handlers = this.handlers[name];
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      let returned = await handler(data);
      if (returned !== true) return false;
    }
    return true;
  }


  on(
    eventName: "beforeInteraction" | "afterInteraction",
    handler: (data: IDBIBaseExecuteCtx) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(
    eventName: "beforeEvent" | "afterEvent",
    handler: (data: { [key: string]: any, other: Record<string, any> }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(
    eventName: "interactionRateLimit",
    handler: (data: Omit<IDBIBaseExecuteCtx, "other" | "setRateLimit"> & { rateLimit: { type: TDBIRateLimitTypes, duration: number, at: number } }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): (() => any);

  on(eventName: TDBIEventNames, handler: (data: any) => Promise<boolean> | boolean, options: { once: boolean } = { once: false }): (() => any) {
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
    l.splice(l.indexOf(handler), 1);
  }
}