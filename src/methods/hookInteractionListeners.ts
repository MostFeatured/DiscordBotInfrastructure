import { DBI } from "../DBI";
import Discord from "discord.js";

export function hookInteractionListeners(DBI: DBI): () => any {
  async function handle(inter: Discord.Interaction<Discord.CacheType>) {

    const dbiInter =
      DBI.data.interactions.find(i => (
        (
          i.type == "ChatInput"
          && (inter.isChatInputCommand() || inter.isAutocomplete())
          && i.name == [inter.commandName, inter.options.getSubcommandGroup(false), inter.options.getSubcommand(false)].filter(i=>!!i).join(" ")
        )
        ||
        (
          i.type == "MessageContextMenu"
          && inter.isMessageContextMenuCommand()
          && inter.commandName == i.name
        )
        ||
        (
          i.type == "UserContextMenu"
          && inter.isUserContextMenuCommand()
          && inter.commandName == i.name
        )
        ||
        (
          i.type == "Button"
          && inter.isButton()
          && inter.customId == i.name
        )
        ||
        (
          i.type == "SelectMenu"
          && inter.isSelectMenu()
          && inter.customId == i.name
        )
        ||
        (
          i.type == "Modal"
          && inter.isModalSubmit()
          && inter.customId == i.name
        )
      ));
    
    if (!dbiInter) return;
    
    if (inter.isAutocomplete()) {
      let focussed = inter.options.getFocused(true);
      let option = dbiInter.options.find(i => i.name == focussed.name);
      if (option?.onComplete) {
        let response = await option.onComplete({
          value: focussed.value,
          interaction: inter,
          DBI
        });
        await inter.respond(response);
      }
      return;
    }

    let rateLimitKeyMap = {
      "User": `${inter.user.id}`,
      "Channel": `${inter.channelId || "Channel"}`,
      "Guild": `${inter.guildId || "Guild"}`,
      "Member": `${inter.user.id}_${inter.guildId || "Guild"}`,
      "Message": `${(inter as any)?.message?.id}`
    }

    for (const type in rateLimitKeyMap) {
      let key = `RateLimit:${rateLimitKeyMap[type]}`;
      let val = await DBI.config.store.get(key);
      if (val && Date.now() > val.at + val.duration) {
        await DBI.config.store.del(key);
        val = null;
      }
      if (val) {
        // TODO: Handle ratelimit
        return;
      }
    }

    async function setRateLimit(type: string, duration: number) {
      await DBI.config.store.set(`RateLimit:${rateLimitKeyMap[type]}`, { at: Date.now(), duration });
    }
    
    dbiInter.onExecute({
      DBI,
      interaction: inter as any,
      locale: null,
      other: null,
      setRateLimit
    });
  }

  DBI.client.on("interactionCreate", handle);

  return () => { 
    DBI.client.off("interactionCreate", handle);
  };
}