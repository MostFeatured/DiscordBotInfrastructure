import { ApplicationCommandType, ChatInputCommandInteraction, Message, MessagePayload } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { FakeMessageInteraction } from "../types/other/FakeMessageInteraction";

export async function handleMessageCommands(dbi: DBI<NamespaceEnums>, message: Message) {
  const chatInputs = dbi.data.interactions.filter(i => i.type === "ChatInput");
  const prefixes = dbi.config.messageCommands.prefixes ?? [];
  if (!prefixes.length) return;
  const content = message.content;
  const usedPrefix = prefixes.find(p => content.startsWith(p));
  if (!usedPrefix) return;
  const contentWithoutPrefix = content.slice(usedPrefix?.length ?? 0);
  const contentLower = contentWithoutPrefix.toLowerCase();

  let locale: string = message.guild.preferredLocale?.split("-")?.at(0) || dbi.config.defaults.locale as any;
  let usedAlias: string | undefined;
  let chatInput = chatInputs.find(i => {
    let found = contentLower.startsWith(i.name);
    if (found) return true;
    let alias = i.other?.messageCommand?.aliases?.find(a => contentLower.startsWith(a));
    if (alias) {
      usedAlias = alias;
      return true;
    }
    return false;
  });
  let commandName = usedAlias ?? chatInput?.name;

  if (!chatInput) {
    fLoop: for (const [localeInterName, localeData] of dbi.data.interactionLocales) {
      for (const [localeName, translation] of Object.entries(localeData.data || {})) {
        if (contentLower.startsWith(translation.name)) {
          commandName = translation.name;
          locale = localeName;
          chatInput = chatInputs.find(i => i.name === localeData.name);
          break fLoop;
        }
      }
    }
  }

  if (!chatInput) return;

  const interaction = new FakeMessageInteraction(dbi, message, chatInput, locale, commandName, usedPrefix);

  dbi.data.clients.first().client.emit("interactionCreate", interaction as any);
}