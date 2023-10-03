import { ApplicationCommandType, ChatInputCommandInteraction, Locale, Message, MessagePayload } from "discord.js";
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

  let locale: Locale = message.guild.preferredLocale || dbi.config.defaults.locale as any;
  let chatInput = chatInputs.find(i => contentLower.startsWith(i.name));
  let commandName = chatInput?.name;

  if (!chatInput) {
    fLoop: for (const [localeInterName, localeData] of dbi.data.interactionLocales) {
      for (const [localeName, translation] of Object.entries(localeData.data || {})) {
        if (contentLower.startsWith(translation.name)) {
          commandName = translation.name;
          locale = localeName as any;
          chatInput = chatInputs.find(i => i.name === localeData.name);
          break fLoop;
        }
      }
    }
  }

  if (!chatInput) return;

  // let repliedMessage: Message;
  // let lastFollowUp: Message;
  // let obj: ChatInputCommandInteraction = {
  //   channelId: message.channel.id,
  //   commandName: chatInput.name,
  //   appPermissions: message.guild.members.me.permissionsIn(message.channel as any),
  //   applicationId: message.client.user.id,
  //   channel: message.channel as any,
  //   command: null,
  //   commandGuildId: message.guild.id,
  //   commandId: null,
  //   commandType: ApplicationCommandType.ChatInput,
  //   awaitModalSubmit() {
  //     throw new Error("Method not implemented.");
  //   },
  //   async fetchReply() {
  //     return  repliedMessage?.id && await message.channel.messages.fetch(repliedMessage.id);
  //   },
  //   deferred: false,
  //   client: message.client,
  //   createdAt: message.createdAt,
  //   ephemeral: false,
  //   createdTimestamp: message.createdTimestamp,
  //   guild: message.guild,
  //   guildId: message.guild.id,
  //   guildLocale: message.guild.preferredLocale,
  //   id: message.id,
  //   inGuild() { return true; },
  //   async deferReply(options: { ephemeral: boolean }) {
  //     if (options.ephemeral) throw new Error("Ephemeral replies are not supported in message commands.");
  //     if (repliedMessage) throw new Error("Already deferred reply.");
  //     repliedMessage = await message.reply("Loading...");
  //     this.deferred = true;
  //     return repliedMessage;
  //   },
  //   async deleteReply() {
  //     if (!repliedMessage) throw new Error("No deferred reply.");
  //     await repliedMessage.delete();
  //     repliedMessage = undefined;
  //   },
  //   async followUp(content: string | MessagePayload) {
  //     if (!repliedMessage) throw new Error("No deferred reply.");
  //     if (!lastFollowUp) {
  //       lastFollowUp = await repliedMessage.reply(content);
  //     } else {
  //       lastFollowUp = await lastFollowUp.reply(content);
  //     }
  //     return lastFollowUp;
  //   },
  //   async editReply(content: string | MessagePayload) {
  //     if (!repliedMessage) throw new Error("No deferred reply.");
  //     await repliedMessage.edit(content);
  //     return repliedMessage;
  //   },
  //   async reply(content: string | MessagePayload) {
  //     if (repliedMessage) throw new Error("Already deferred reply.");
  //     repliedMessage = await message.reply(content);
  //     return repliedMessage;
  //   }
  // }

  const interaction = new FakeMessageInteraction(message, chatInput, locale, commandName);

  dbi.client().client.emit("interactionCreate", interaction as any);
}