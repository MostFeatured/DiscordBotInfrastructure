import { DBI } from "../DBI";
import Discord from "discord.js";
import { parseCustomId } from "../utils/customId";

export function hookInteractionListeners(dbi: DBI): () => any {
  async function handle(inter: Discord.Interaction<Discord.CacheType>) {

    const dbiInter =
      dbi.data.interactions.find(i => {
        let isUsesCustomId = (inter.isButton() || inter.isSelectMenu() || inter.isModalSubmit());
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
            (i.type == "Button" || i.type == "SelectMenu" || i.type == "Modal")
            && isUsesCustomId
            && parsedId.name == i.name
          )
        )
      });
    
    if (!dbiInter) return;
    
    if (inter.isAutocomplete()) {
      let focussed = inter.options.getFocused(true);
      let option = (dbiInter.options as any[]).find(i => i.name == focussed.name);
      if (option?.onComplete) {
        let response = await option.onComplete({
          value: focussed.value,
          interaction: inter,
          dbi
        });
        await inter.respond(response);
      }
      return;
    }

    let localeName = inter.locale.split("-")[0];
    let locale = dbi.data.locales.has(localeName) ? dbi.data.locales.get(localeName) : dbi.data.locales.get(dbi.config.defaultLocale);

    let data = (inter.isButton() || inter.isSelectMenu() || inter.isModalSubmit()) ? parseCustomId(dbi, inter.customId).data : undefined;

    let rateLimitKeyMap = {
      "User": `${inter.user.id}`,
      "Channel": `${inter.channelId || "Channel"}`,
      "Guild": `${inter.guildId || "Guild"}`,
      "Member": `${inter.user.id}_${inter.guildId || "Guild"}`,
      "Message": `${(inter as any)?.message?.id}`
    }

    for (const type in rateLimitKeyMap) {
      let key = `RateLimit:${rateLimitKeyMap[type]}`;
      let val = await dbi.config.store.get(key);
      if (val && Date.now() > val.at + val.duration) {
        await dbi.config.store.del(key);
        val = null;
      }
      if (val) {
        dbi.events.trigger("interactionRateLimit", { dbi, interaction: inter, locale, data })
        return;
      }
    }

    async function setRateLimit(type: string, duration: number) {
      await dbi.config.store.set(`RateLimit:${rateLimitKeyMap[type]}`, { at: Date.now(), duration });
    }

    if (!(await dbi.events.trigger("beforeInteraction", { dbi, interaction: inter, locale, setRateLimit, data }))) return;

    await dbiInter.onExecute({
      dbi,
      // @ts-ignore
      interaction: inter as any,
      locale,
      setRateLimit,
      data
    });
    
    dbi.events.trigger("afterInteraction", { dbi, interaction: inter, locale, setRateLimit, data });
  }

  dbi.client.on("interactionCreate", handle);

  return () => { 
    dbi.client.off("interactionCreate", handle);
  };
}