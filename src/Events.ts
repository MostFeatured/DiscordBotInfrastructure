import { NamespaceEnums, NamespaceData } from "../generated/namespaceData";
import { DBI } from "./DBI";
import { TDBIMessageCommandArgumentErrorTypes } from "./methods/handleMessageCommands";
import { DBIChatInput } from "./types/ChatInput/ChatInput";
import { TDBIValueName } from "./types/ChatInput/ChatInputOptions";
import { ClientEvents, DBIEvent } from "./types/Event";
import { IDBIBaseExecuteCtx, TDBIRateLimitTypes } from "./types/Interaction";
import { FakeMessageInteraction } from "./types/other/FakeMessageInteraction";
import { DBILocale } from "./types/other/Locale";
import Discord, { PermissionsString } from "discord.js";

export type TDBIEventNames =
  | "beforeInteraction"
  | "afterInteraction"
  | "interactionRateLimit"
  | "beforeEvent"
  | "afterEvent"
  | "interactionError"
  | "eventError"
  | "messageCommandArgumentError"
  | "messageCommandDirectMessageUsageError"
  | "messageCommandDefaultMemberPermissionsError"
  | "clientsReady";

export type TDBIEventHandlerCtx<TNamespace extends NamespaceEnums> = {
  [K in keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])]: {
    other: Record<string, any>;
    locale?: { guild: DBILocale<TNamespace> };
    eventName: K;
    dbiEvent: DBIEvent<TNamespace>;
  } & (ClientEvents & NamespaceData[TNamespace]["customEvents"])[K];
}[keyof (ClientEvents & NamespaceData[TNamespace]["customEvents"])];

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
      afterEvent: [],
      interactionError: [],
      eventError: [],
    };
  }

  async trigger(name: TDBIEventNames, data?: any, ignoreResponse = false): Promise<boolean> {
    let handlers = this.handlers[name];
    if (!handlers?.length) return true;
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      if (!ignoreResponse) {
        let returned = await handler(data);
        if (returned !== true) return false;
      } else {
        handler(data);
      }
    }
    return true;
  }

  on(
    eventName: "clientsReady",
    handler: () => any,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "beforeInteraction" | "afterInteraction",
    handler: (
      data: IDBIBaseExecuteCtx<TNamespace>
    ) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "interactionError",
    handler: (
      data: IDBIBaseExecuteCtx<TNamespace> & { error: any }
    ) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "beforeEvent" | "afterEvent",
    handler: (
      data: TDBIEventHandlerCtx<TNamespace>
    ) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "eventError",
    handler: (
      data: TDBIEventHandlerCtx<TNamespace> & {
        error: any;
        dbiEvent: DBIEvent<TNamespace>;
      }
    ) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "interactionRateLimit",
    handler: (
      data: Omit<IDBIBaseExecuteCtx<TNamespace>, "other" | "setRateLimit"> & {
        rateLimit: { type: TDBIRateLimitTypes; duration: number; at: number };
      }
    ) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "messageCommandArgumentError",
    handler: (data: {
      message: Discord.Message;
      interaction: FakeMessageInteraction;
      error: {
        type: TDBIMessageCommandArgumentErrorTypes;
        option: any;
        index: number;
        extra?: any;
      };
      value: any;
      locale: { guild?: DBILocale<TNamespace>; user: DBILocale<TNamespace> };
      dbiInteraction: DBIChatInput<TNamespace>;
    }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "messageCommandDefaultMemberPermissionsError",
    handler: (data: {
      message: Discord.Message;
      interaction: FakeMessageInteraction;
      locale: { guild?: DBILocale<TNamespace>; user: DBILocale<TNamespace> };
      permissions: PermissionsString[];
      dbiInteraction: DBIChatInput<TNamespace>;
    }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: "messageCommandDirectMessageUsageError",
    handler: (data: {
      message: Discord.Message;
      interaction: FakeMessageInteraction;
      locale: { guild?: DBILocale<TNamespace>; user: DBILocale<TNamespace> };
      dbiInteraction: DBIChatInput<TNamespace>;
    }) => Promise<boolean> | boolean,
    options?: { once: boolean }
  ): () => any;

  on(
    eventName: TDBIEventNames,
    handler: (data: any) => Promise<boolean> | boolean,
    options: { once: boolean } = { once: false }
  ): () => any {
    if (!this.handlers.hasOwnProperty(eventName)) this.handlers[eventName] = [];
    if (options.once) {
      let h = (data) => {
        this.off(eventName, h);
        return handler(data);
      };
      this.on(eventName as any, h as any, { once: false });
      return () => {
        this.off(eventName, h);
      };
    } else {
      this.handlers[eventName].push(handler);
      return () => {
        this.off(eventName, handler);
      };
    }
  }

  off(
    eventName: TDBIEventNames,
    handler: (data: any) => Promise<boolean> | boolean
  ) {
    let l = this.handlers[eventName];
    if (!l) return [];
    return l.splice(l.indexOf(handler), 1);
  }
}
