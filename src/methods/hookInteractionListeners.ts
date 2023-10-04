import { DBI } from "../DBI";
import Discord from "discord.js";
import { parseCustomId } from "../utils/customId";
import { NamespaceEnums } from "../../generated/namespaceData";

const componentTypes = ["Button", "StringSelectMenu", "UserSelectMenu", "RoleSelectMenu", "ChannelSelectMenu", "MentionableSelectMenu", "Modal"]

export function hookInteractionListeners(dbi: DBI<NamespaceEnums>): () => any {
  async function handle(inter: Discord.Interaction<"cached">) {
    const dbiInter =
      (inter as any).dbiChatInput ?? dbi.data.interactions.find(i => {
        let isUsesCustomId = (inter.isButton() || inter.isAnySelectMenu() || inter.isModalSubmit());
        let parsedId = isUsesCustomId ? parseCustomId(dbi, (inter as any).customId) : null;
        return (
          (
            i.type == "ChatInput"
            && (inter.isChatInputCommand() || inter.isAutocomplete())
            && i.name == [inter.commandName, inter.options.getSubcommandGroup(false), inter.options.getSubcommand(false)].filter(i => !!i).join(" ")
          )
          ||
          (
            (i.type == "MessageContextMenu" || i.type == "UserContextMenu")
            && (inter.isMessageContextMenuCommand() || inter.isUserContextMenuCommand())
            && inter.commandName == i.name
          )
          ||
          (
            componentTypes.includes(i.type)
            && isUsesCustomId
            && parsedId?.name == i.name
          )
        )
      });
    
    if (!dbiInter) return;

    let userLocaleName = inter.locale.split("-")[0];
    let userLocale = dbi.data.locales.has(userLocaleName) ? dbi.data.locales.get(userLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale);

    let guildLocaleName = inter.guild ? inter.guild.preferredLocale.split("-")[0] : null;
    let guildLocale = guildLocaleName ? (dbi.data.locales.has(guildLocaleName) ? dbi.data.locales.get(guildLocaleName) : dbi.data.locales.get(dbi.config.defaults.locale)) : null;

    let locale = {
      user: userLocale,
      guild: guildLocale
    };

    let data = (inter.isButton() || inter.isAnySelectMenu() || inter.isModalSubmit()) ? parseCustomId(dbi, inter.customId).data : undefined;

    let other = {};

    if (!(await dbi.events.trigger("beforeInteraction", { dbi, interaction: inter, locale, setRateLimit, data, other, dbiInteraction: dbiInter }))) return;
    
    if (inter.isAutocomplete()) {
      let focussed = inter.options.getFocused(true);
      let option = (dbiInter.options as any[]).find(i => i.name == focussed.name);
      if (option?.onComplete) {
        let response = await option.onComplete({
          value: focussed.value,
          interaction: inter,
          dbiInteraction: dbiInter,
          dbi,
          data,
          other,
          locale
        });
        await inter.respond(response);
      }
      return;
    }

    let rateLimitKeyMap = {
      "User": `${dbiInter.name}_${inter.user.id}`,
      "Channel": `${dbiInter.name}_${inter.channelId || "Channel"}`,
      "Guild": `${dbiInter.name}_${inter.guildId || "Guild"}`,
      "Member": `${dbiInter.name}_${inter.user.id}_${inter.guildId || "Guild"}`,
      "Message": `${dbiInter.name}_${(inter as any)?.message?.id}`
    }

    for (const type in rateLimitKeyMap) {
      // @ts-ignore
      let key = `RateLimit["${rateLimitKeyMap[type]}"]`;
      let val = await dbi.config.store.get(key);
      if (val && Date.now() > val.at + val.duration) {
        await dbi.config.store.delete(key);
        val = null;
      }
      if (val) {
        if ((await dbi.events.trigger("interactionRateLimit", {
          dbi,
          interaction: inter,
          dbiInteraction: dbiInter,
          locale,
          data,
          rateLimit: {
            type: key,
            ...val
          }
        })) === true) return;
      }
    }

    async function setRateLimit(type: string, duration: number) {
      // @ts-ignore
      await dbi.config.store.set(`RateLimit["${rateLimitKeyMap[type]}"]`, { at: Date.now(), duration });
    }

    for (const rateLimit of dbiInter.rateLimits) {
      await setRateLimit(rateLimit.type, rateLimit.duration);
    }

    let arg = {
      // @ts-ignore
      dbi,
      // @ts-ignore
      interaction: inter as any,
      // @ts-ignore
      dbiInteraction: dbiInter,
      // @ts-ignore
      locale,
      // @ts-ignore
      setRateLimit,
      // @ts-ignore
      data,
      // @ts-ignore
      other
    };

    if (dbi.config.strict) {
      // @ts-ignore
      await dbiInter.onExecute(arg);
    } else {
      try {
        // @ts-ignore
        await dbiInter.onExecute(arg);
      } catch (error) {
        // @ts-ignore
        await dbi.events.trigger("interactionError", Object.assign(arg, { error }));
      }
    }
    
    // @ts-ignore
    dbi.events.trigger("afterInteraction", { dbi, interaction: inter, dbiInteraction: dbiInter, locale, setRateLimit, data, other });
  }

  dbi.data.clients.forEach(d=>{
    d.client.on("interactionCreate", handle);
  });

  return () => { 
    dbi.data.clients.forEach(d=>{
      d.client.off("interactionCreate", handle);
    });
  };
}