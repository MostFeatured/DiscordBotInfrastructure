import Discord from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { DBILocale } from "./Locale";

export interface ClientEvents {
  applicationCommandPermissionsUpdate: { data: Discord.ApplicationCommandPermissionsUpdateData };
  cacheSweep: { message: string };
  channelCreate: { channel: Discord.NonThreadGuildBasedChannel };
  channelDelete: { channel: Discord.DMChannel | Discord.NonThreadGuildBasedChannel };
  channelPinsUpdate: { channel: Discord.TextBasedChannel, date: Date };
  channelUpdate: {
    oldChannel: Discord.DMChannel | Discord.NonThreadGuildBasedChannel,
    newChannel: Discord.DMChannel | Discord.NonThreadGuildBasedChannel,
  };
  debug: { message: string };
  warn: { message: string };
  emojiCreate: { emoji: Discord.GuildEmoji };
  emojiDelete: { emoji: Discord.GuildEmoji };
  emojiUpdate: { oldEmoji: Discord.GuildEmoji, newEmoji: Discord.GuildEmoji };
  error: { error: Error };
  guildBanAdd: { ban: Discord.GuildBan };
  guildBanRemove: { ban: Discord.GuildBan };
  guildCreate: { guild: Discord.Guild };
  guildDelete: { guild: Discord.Guild };
  guildUnavailable: { guild: Discord.Guild };
  guildIntegrationsUpdate: { guild: Discord.Guild };
  guildMemberAdd: { member: Discord.GuildMember };
  guildMemberAvailable: { member: Discord.GuildMember | Discord.PartialGuildMember };
  guildMemberRemove: { member: Discord.GuildMember | Discord.PartialGuildMember };
  guildMembersChunk: {
    members: Discord.Collection<Discord.Snowflake, Discord.GuildMember>,
    guild: Discord.Guild,
    data: { count: number; index: number; nonce: string | undefined },
  };
  guildMemberUpdate: { oldMember: Discord.GuildMember | Discord.PartialGuildMember, newMember: Discord.GuildMember };
  guildUpdate: { oldGuild: Discord.Guild, newGuild: Discord.Guild };
  inviteCreate: { invite: Discord.Invite };
  inviteDelete: { invite: Discord.Invite };
  messageCreate: { message: Discord.Message };
  messageDelete: { message: Discord.Message | Discord.PartialMessage };
  messageReactionRemoveAll: {
    message: Discord.Message | Discord.PartialMessage,
    reactions: Discord.Collection<string | Discord.Snowflake, Discord.MessageReaction>,
  };
  messageReactionRemoveEmoji: { reaction: Discord.MessageReaction | Discord.PartialMessageReaction };
  messageDeleteBulk: { messages: Discord.Collection<Discord.Snowflake, Discord.Message | Discord.PartialMessage>, channel: Discord.TextBasedChannel };
  messageReactionAdd: { reaction: Discord.MessageReaction | Discord.PartialMessageReaction, user: Discord.User | Discord.PartialUser };
  messageReactionRemove: { reaction: Discord.MessageReaction | Discord.PartialMessageReaction, user: Discord.User | Discord.PartialUser };
  messageUpdate: { oldMessage: Discord.Message | Discord.PartialMessage, newMessage: Discord.Message | Discord.PartialMessage };
  presenceUpdate: { oldPresence: Discord.Presence | null, newPresence: Discord.Presence };
  ready: { client: Discord.Client<true> };
  invalidated: {};
  roleCreate: { role: Discord.Role };
  roleDelete: { role: Discord.Role };
  roleUpdate: { oldRole: Discord.Role, newRole: Discord.Role };
  threadCreate: { thread: Discord.AnyThreadChannel, newlyCreated: boolean };
  threadDelete: { thread: Discord.AnyThreadChannel };
  threadListSync: { threads: Discord.Collection<Discord.Snowflake, Discord.AnyThreadChannel>, guild: Discord.Guild };
  threadMemberUpdate: { oldMember: Discord.ThreadMember, newMember: Discord.ThreadMember };
  threadMembersUpdate: {
    addedMembers: Discord.Collection<Discord.Snowflake, Discord.ThreadMember>,
    removedMembers: Discord.Collection<Discord.Snowflake, Discord.ThreadMember | Discord.PartialThreadMember>,
    thread: Discord.AnyThreadChannel,
  };
  threadUpdate: { oldThread: Discord.AnyThreadChannel, newThread: Discord.AnyThreadChannel };
  typingStart: { typing: Discord.Typing };
  userUpdate: { oldUser: Discord.User | Discord.PartialUser, newUser: Discord.User };
  voiceStateUpdate: { oldState: Discord.VoiceState, newState: Discord.VoiceState };
  webhookUpdate: { channel: Discord.TextChannel | Discord.NewsChannel | Discord.VoiceChannel };
  interactionCreate: { interaction: Discord.Interaction };
  shardDisconnect: { closeEvent: Discord.CloseEvent, shardId: number };
  shardError: { error: Error, shardId: number };
  shardReady: { shardId: number, unavailableGuilds: Set<Discord.Snowflake> | undefined };
  shardReconnecting: { shardId: number };
  shardResume: { shardId: number, replayedEvents: number };
  stageInstanceCreate: { stageInstance: Discord.StageInstance };
  stageInstanceUpdate: { oldStageInstance: Discord.StageInstance | null, newStageInstance: Discord.StageInstance };
  stageInstanceDelete: { stageInstance: Discord.StageInstance };
  stickerCreate: { sticker: Discord.Sticker };
  stickerDelete: { sticker: Discord.Sticker };
  stickerUpdate: { oldSticker: Discord.Sticker, newSticker: Discord.Sticker };
  guildScheduledEventCreate: { guildScheduledEvent: Discord.GuildScheduledEvent };
  guildScheduledEventUpdate: {
    oldGuildScheduledEvent: Discord.GuildScheduledEvent | null,
    newGuildScheduledEvent: Discord.GuildScheduledEvent,
  };
  guildScheduledEventDelete: { guildScheduledEvent: Discord.GuildScheduledEvent };
  guildScheduledEventUserAdd: { guildScheduledEvent: Discord.GuildScheduledEvent, user: Discord.User };
  guildScheduledEventUserRemove: { guildScheduledEvent: Discord.GuildScheduledEvent, user: Discord.User };
}

export type DBIEventCombinations<TNamespace extends NamespaceEnums> = {
  [K in keyof ClientEvents]: {
    name: K,
    onExecute: (ctx: ClientEvents[K] & { other: Record<string, any>, locale?: { guild: DBILocale<TNamespace> }, eventName: string }) => Promise<any> | any
  }
}[keyof ClientEvents];

export type TDBIEventOmitted<TNamespace extends NamespaceEnums> = Omit<DBIEvent<TNamespace>, "type" | "name" | "onExecute" | "client" | "dbi"> & DBIEventCombinations<TNamespace>;

export class DBIEvent<TNamespace extends NamespaceEnums> {
  readonly type: "Event";
  other?: Record<string, any>;
  id?: string;
  name: string;
  onExecute: (...args: any[]) => any;
  ordered?: boolean;
  dbi: DBI<TNamespace>;
  constructor(dbi: DBI<TNamespace>, cfg: TDBIEventOmitted<TNamespace>) {
    this.dbi = dbi;
    this.type = "Event";
    this.id = cfg.id;
    this.other = cfg.other;
    this.name = cfg.name;
    this.onExecute = cfg.onExecute;
    this.ordered = cfg.ordered ?? false;
  }
}