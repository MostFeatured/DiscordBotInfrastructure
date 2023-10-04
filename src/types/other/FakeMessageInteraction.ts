import { Message, MessagePayload, ApplicationCommandType, ChatInputCommandInteraction, Locale, APIInteractionGuildMember, GuildMember, PermissionsBitField, CacheType, CommandInteractionOptionResolver, CommandOptionDataTypeResolvable, ApplicationCommandOptionType, User, Attachment } from 'discord.js';
import { TDBIInteractions } from '../Interaction';
import { plsParseArgs } from "plsargs";
import { DBI } from '../../DBI';
import { NamespaceEnums } from "../../../generated/namespaceData";
import { ChannelType } from "discord-api-types/v10";

export class FakeMessageInteraction /* implements ChatInputCommandInteraction */ {
  channelId: string;
  commandName: string;
  appPermissions: any;
  applicationId: string;
  channel: any; 
  command: any;
  commandGuildId: string;
  commandId: any; 
  commandType: ApplicationCommandType.ChatInput;
  // awaitModalSubmit: (...arr: any[]) => any;
  // fetchReply: () => Promise<any>;
  deferred: boolean = false;
  client: any; 
  createdAt: Date;
  ephemeral: boolean = false;
  createdTimestamp: number;
  guild: any; 
  guildId: string;
  guildLocale: Locale;
  id: string;
  user: User;
  private repliedMessage: Message | undefined;
  private lastFollowUp: Message | undefined;
  member: GuildMember | APIInteractionGuildMember;
  memberPermissions: Readonly<PermissionsBitField>;
  parsedArgs = new Map<string, FakeMessageInteractionArgument>();
  usedCommandName: string;
  fullCommandName: string;
  options: any;
  dbiChatInput: TDBIInteractions<string | number>;
  dbiChatInputOptions: any[];
  fake: boolean = true;

  constructor(private dbi: DBI<NamespaceEnums>, private message: Message, chatInput: TDBIInteractions<string | number>, public locale: string, commandName: string, private usedPrefix: string) {
    const self = this;
    
    this.channelId = message.channel.id;
    this.commandName = chatInput.name.split(" ").at(0);
    this.appPermissions = message.guild?.members.me.permissionsIn(message.channel as any) ?? new PermissionsBitField(8n);
    this.applicationId = message.client.user.id;
    this.channel = message.channel as any;
    this.commandGuildId = message.guild.id;
    this.commandType = ApplicationCommandType.ChatInput;
    
    this.client = message.client;
    this.createdAt = message.createdAt;
    this.createdTimestamp = message.createdTimestamp;
    this.guild = message.guild;
    this.guildId = message.guild?.id;
    this.guildLocale = message.guild?.preferredLocale;
    this.id = message.guild.commands.cache.find((cmd) => cmd.name === this.commandName)?.id ?? "-1";
    this.locale = message.guild?.preferredLocale;
    this.member = message.member;
    this.memberPermissions = message.member?.permissions;
    this.user = message.author;

    this.usedCommandName = commandName;
    this.fullCommandName = chatInput.name;
    this.dbiChatInput = chatInput;
    this.dbiChatInputOptions = chatInput.options ? chatInput.options.map(i => ({ ...i })) : []; 

    {
      const argContent = message.content.slice(usedPrefix.length + commandName.length).replace(/ +/, " ").trim();
      const args = plsParseArgs(argContent);

      const options = chatInput.options ?? [];
      const atchs = [...message.attachments.values()];
      for (let i = 0, attachmentIndex = 0, namedValueSize = 0; i < options.length; i++) {
        const option = options[i];
        if (!option) break;
        if (option.type === ApplicationCommandOptionType.Attachment) {
          this.parsedArgs.set(option.name, {
            type: option.type,
            value: atchs.at(attachmentIndex)?.url,
            attachment: atchs.at(attachmentIndex++)
          })
          continue;
        }
        const arg = args.get(option.name) ?? args.get(i - attachmentIndex - namedValueSize);
        if (args.get(option.name)) namedValueSize++;
        this.parsedArgs.set(option.name, {
          type: option.type,
          value: arg
        });
      }

      console.log(this.parsedArgs)
    }

    this.options = {
      get(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        return {
          value: rawValue,
          get boolean() { return self.options.getBoolean(name); },
          get channel() { return self.options.getChannel(name); },
          get string() { return self.options.getString(name); },
          get integer() { return self.options.getInteger(name); },
          get number() { return self.options.getNumber(name); },
          get user() { return self.options.getUser(name); },
          get member() { return self.options.getMember(name); },
          get role() { return self.options.getRole(name); },
          get mentionable() { return self.options.getMentionable(name); },
          get attachment() { return self.options.getAttachment(name); }
        };
      },
      getSubcommand() {
        let splitted = self.fullCommandName.split(" ");
        if (splitted.length === 1) return null;
        return splitted.at(-1);
      },
      getSubcommandGroup() {
        let splitted = self.fullCommandName.split(" ");
        if (splitted.length === 3) return splitted[1];
        return null;
      },
      getBoolean(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        return !!self.dbi.config.messageCommands.typeAliases.booleans[rawValue.toLowerCase()];
      },
      getChannel(name: string, _: any, channelType?: ChannelType) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        let value = rawValue.replace(/<#|>/g, "");
        let channel = self.message.client.channels.cache.get(value);
        if (!channel) channel = self.message.client.channels.cache.find(c => {
          if (self.guildId && (c as any).guildId && (c as any).guildId !== self.guildId) return false;
          return (c as any).name === value;
        });
        if (channelType && channel?.type !== channelType) return null;
        return channel;
      },
      getString(name: string) {
        const dbiOption = self.getClonedDBIOption(name);
        let rawValue = `${self.getRawOptionValue(name)}`;
        let choices = dbiOption.choices ?? dbiOption._choices;
        if (choices) return choices.find(c => c.value === rawValue || c.name === rawValue)?.value ?? rawValue;
        return rawValue;
      },
      getInteger(name: string) {
        const dbiOption = self.getClonedDBIOption(name);
        let rawValue = self.getRawOptionValue(name);
        let parsedValue = parseInt(rawValue);
        let choices = dbiOption.choices ?? dbiOption._choices;
        if (choices) return choices.find(c => c.value === parsedValue || c.name === rawValue)?.value ?? rawValue;
        return rawValue;
      },
      getNumber(name: string) {
        const dbiOption = self.getClonedDBIOption(name);
        let rawValue = self.getRawOptionValue(name);
        let parsedValue = parseFloat(rawValue);
        let choices = dbiOption.choices ?? dbiOption._choices;
        if (choices) return choices.find(c => c.value === parsedValue || c.name === rawValue)?.value ?? rawValue;
        return rawValue;
      },
      getUser(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        let value = rawValue.replace(/<@!?|>/g, "");
        let user = self.message.client.users.cache.get(value);
        if (!user) user = self.message.client.users.cache.find(u => u.username === value || u.tag === value);
        return user;
      },
      getMember(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        let value = rawValue.replace(/<@!?|>/g, "");
        let member = self.message.guild?.members.cache.get(value);
        if (!member) member = self.message.guild?.members.cache.find(m => m.user.username === value || m.user.tag === value);
        return member;
      },
      getRole(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        let value = rawValue.replace(/<@&|>/g, "");
        let role = self.message.guild?.roles.cache.get(value);
        if (!role) role = self.message.guild?.roles.cache.find(r => r.name === value);
        return role;
      },
      getMentionable(name: string) {
        const rawValue = self.getRawOptionValue(name);
        if (!rawValue) return null;
        let value = rawValue.replace(/<@(!|&)?|>/g, "");
        let user = self.message.client.users.cache.get(value);
        if (!user) user = self.message.client.users.cache.find(u => u.username === value || u.tag === value);
        if (user) return user;
        let member = self.message.guild?.members.cache.get(value);
        if (!member) member = self.message.guild?.members.cache.find(m => m.user.username === value || m.user.tag === value);
        if (member) return member;
        let role = self.message.guild?.roles.cache.get(value);
        if (!role) role = self.message.guild?.roles.cache.find(r => r.name === value);
        if (role) return role;
        return null;
      },
      getMessage() {
        return self.message;
      },
      getAttachment(name: string) {
        let d = self.parsedArgs.get(name);
        return d?.attachment ?? null;
      }
    }
  }

  private getRawOptionValue(name: string): any {
    return this.parsedArgs.get(name)?.value;
  }

  private getClonedDBIOption(name: string): any {
    return this.dbiChatInputOptions.find(o => o.name === name);
  }

  inGuild() {
    return true;
  }

  async deferReply(options: any): Promise<any> {
    // if (options.ephemeral) throw new Error("Ephemeral replies are not supported in message commands.");
    if (this.repliedMessage) throw new Error("Already deferred reply.");
    this.repliedMessage = await this.message.reply(options.content ?? "Loading...");
    this.deferred = true;
    return this.repliedMessage;
  }

  async deleteReply() {
    if (!this.repliedMessage) throw new Error("No deferred reply.");
    await this.repliedMessage.delete();
    this.repliedMessage = undefined;
  }

  async followUp(content: string | MessagePayload) {
    if (!this.repliedMessage) throw new Error("No deferred reply.");
    if (!this.lastFollowUp) {
      this.lastFollowUp = await this.repliedMessage.reply(content);
    } else {
      this.lastFollowUp = await this.lastFollowUp.reply(content);
    }
    return this.lastFollowUp;
  }

  async editReply(content: string | MessagePayload) {
    if (!this.repliedMessage) throw new Error("No deferred reply.");
    await this.repliedMessage.edit(content);
    return this.repliedMessage;
  }

  async reply(content: string | MessagePayload): Promise<any> {
    if (this.repliedMessage) throw new Error("Already deferred reply.");
    this.repliedMessage = await this.message.reply(content);
    return this.repliedMessage;
  }

  async awaitModalSubmit() {
    throw new Error("Method not implemented.");
  };

  async fetchReply() {
    return this.repliedMessage?.id && await this.message.channel.messages.fetch(this.repliedMessage.id);
  };

  isAnySelectMenu() { return false; }
  isAutocomplete() { return false; }
  isButton() { return false; }
  isChannelSelectMenu() { return false; }
  isChatInputCommand() { return true; }
  isCommand() { return true; }
  isContextMenuCommand() { return false; }
  isMentionableSelectMenu() { return false; }
  isMessageComponent() { return false; }
  isMessageContextMenuCommand() { return false; }
  isModalSubmit() { return false; }
  isRepliable() { return true; }
  isRoleSelectMenu() { return false; }
  isStringSelectMenu() { return false; }
  isUserContextMenuCommand() { return false; }
  isUserSelectMenu() { return false; }
  isSelectMenu() { return false; }
}

interface FakeMessageInteractionArgument {
  type: ApplicationCommandOptionType,
  value: any,
  attachment?: Attachment
}