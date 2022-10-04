import { Guild } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";

export function hookEventListeners(dbi: DBI<NamespaceEnums>): () => any {
  async function handle(eventName: string, ...args: any[]) {
    if (!dbi.data.eventMap[eventName]) return;

    let isDirect = args?.[0]?._DIRECT_ ?? false;
    if (isDirect) delete args[0]._DIRECT_;
    
    let ctxArgs =
      isDirect
        ? args[0]
        : (dbi.data.eventMap[eventName] as any).reduce((all, current, index) => {
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

    let arg = { eventName, ...ctxArgs, other, locale };

    for (let i = 0; i < unOrdered.length; i++) {
      const value = unOrdered[i];
      if (dbi.config.strict) {
        value.onExecute(arg);
      } else {
        try {
          value.onExecute(arg)?.catch(error => {
            dbi.events.trigger("eventError", Object.assign(arg, { error }));
          });
        } catch (error) {
          dbi.events.trigger("eventError", Object.assign(arg, { error }));
        }
      }
    }

    for (let i = 0; i < ordered.length; i++) {
      const value = ordered[i];
      if (dbi.config.strict) {
        await value.onExecute(arg);
      } else {
        try {
          await value.onExecute(arg)?.catch(error => {
            dbi.events.trigger("eventError", Object.assign(arg, { error }));
          });
        } catch (error) {
          await dbi.events.trigger("eventError", Object.assign(arg, { error }));
        }
      }
    }

    dbi.events.trigger("afterEvent", arg)
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