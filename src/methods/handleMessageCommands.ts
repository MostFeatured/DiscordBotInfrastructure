import { Message, MessagePayload } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";

export function handleMessageCommands(dbi: DBI<NamespaceEnums>, message: Message) {
  const chatInputs = dbi.data.interactions.filter(i => i.type === "ChatInput");
  const prefixes = dbi.config.messageCommands.prefixes ?? [];
  const content = message.content;
  const usedPrefix = prefixes.find(p => content.startsWith(p));
  if (!usedPrefix) return;
  const contentWithoutPrefix = content.slice(usedPrefix?.length ?? 0);
  const contentLower = contentWithoutPrefix.toLowerCase();
  const chatInput = chatInputs.find(i => contentLower.startsWith(i.name));
  if (!chatInput) return;

  let repliedMessage: Message;
  let lastFollowUp: Message;
  let obj  = {
    channelId: message.channel.id,
    async deferReply(options: { ephemeral: boolean }) {
      if (options.ephemeral) throw new Error("Ephemeral replies are not supported in message commands.");
      if (repliedMessage) throw new Error("Already deferred reply.");
      repliedMessage = await message.reply("Loading...");
      return repliedMessage;
    },
    async deleteReply() {
      if (!repliedMessage) throw new Error("No deferred reply.");
      await repliedMessage.delete();
      repliedMessage = undefined;
    },
    async followUp(content: string | MessagePayload) {
      if (!repliedMessage) throw new Error("No deferred reply.");
      if (!lastFollowUp) {
        lastFollowUp = await repliedMessage.reply(content);
      } else {
        lastFollowUp = await lastFollowUp.reply(content);
      }
      return lastFollowUp;
    },
    async editReply(content: string | MessagePayload) {
      if (!repliedMessage) throw new Error("No deferred reply.");
      await repliedMessage.edit(content);
      return repliedMessage;
    },
    async reply(content: string | MessagePayload) {
      if (repliedMessage) throw new Error("Already deferred reply.");
      repliedMessage = await message.reply(content);
      return repliedMessage;
    }
  }

  dbi.client().client.emit("interactionCreate", obj as any);
}