import { Guild } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";

export function hookEventListeners(dbi: DBI<NamespaceEnums>): () => any {
  async function handle(eventName: string, ...args: any[]) {
    if (!dbi.data.eventMap[eventName]) return;

    let ctxArgs =
      dbi.data.eventMap[eventName]
        .reduce((all, current, index) => {
          all[current] = args[index];
          return all;
        }, {});

    let other = {};

    let guildLocaleName = args.reduce((all, current) => {
      if (current?.guild?.id) return current?.guild?.preferredLocale?.split?.("-")?.[0];
      if (current instanceof Guild) return current?.preferredLocale?.split?.("-")?.[0];
      return all;
    }, null);
    let guildLocale = guildLocaleName ? (dbi.data.locales.has(guildLocaleName) ? dbi.data.locales.get(guildLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale)) : null;
    
    let locale = guildLocale ? { guild: guildLocale } : null;
    
    if (!await dbi.events.trigger("beforeEvent", { eventName, ...ctxArgs, other, locale })) return;
    
    let ordered = [];
    let unOrdered = [];
    for (let i = 0; i < dbi.data.events.size; i++) {
      const value = dbi.data.events.at(i);
      if (value.name == eventName) {
        if (value.ordered) {
          ordered.push(value);
        } else {
          unOrdered.push(value);
        }
      }
    }

    for (let i = 0; i < unOrdered.length; i++) {
      const value = unOrdered[i];
      value.onExecute({ eventName, ...ctxArgs, other, locale });
    }

    for (let i = 0; i < ordered.length; i++) {
      const value = ordered[i];
      await value.onExecute({ eventName, ...ctxArgs, other, locale });
    }

    dbi.events.trigger("afterEvent", { eventName, ...ctxArgs, other, locale })
  }

  let originalEmit = dbi.client.emit;

  dbi.client.emit = function(eventName, ...args) {
    handle(eventName, ...args);
    return originalEmit.call(this, eventName, ...args);
  }

  return () => {
    dbi.client.emit = originalEmit;
  }
}