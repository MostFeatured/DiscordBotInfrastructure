import { Message, MessagePayload, ApplicationCommandType, ChatInputCommandInteraction, Locale, APIInteractionGuildMember, GuildMember, PermissionsBitField, CacheType, CommandInteractionOptionResolver, CommandOptionDataTypeResolvable, ApplicationCommandOptionType } from 'discord.js';
import { TDBIInteractions } from '../Interaction';
import { plsParseArgs } from "plsargs";

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
  private repliedMessage: Message | undefined;
  private lastFollowUp: Message | undefined;
  member: GuildMember | APIInteractionGuildMember;
  memberPermissions: Readonly<PermissionsBitField>;
  private parsedArgs = new Map<string, FakeMessageInteractionArgument>();
  private usedCommandName: string;
  options: any;

  constructor(private message: Message, chatInput: TDBIInteractions<string | number>, public locale: string, commandName: string) {
    const self = this;
    
    this.channelId = message.channel.id;
    this.commandName = chatInput.name;
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
    this.id = message.id;
    this.locale = message.guild?.preferredLocale;
    this.member = message.member;
    this.memberPermissions = message.member?.permissions;

    this.usedCommandName = commandName;

    {
      const argContent = message.content.slice(commandName.length).replace(/ +/, " ").trim();
      const args = plsParseArgs(argContent);

      const options = chatInput.options;

      for (let i = 0; i < args._.length; i++) {
        const option = options[i];
        const arg = args.get(i) ?? args.get(option.name);
        if (!option) break;
        this.parsedArgs.set(option.name, {
          type: option.type,
          value: arg
        });
      }
    }

    this.options = {
      get: (name: string, type?: CommandOptionDataTypeResolvable) => {
        const option = this.getOption(name);
        if (!option) return null;
        if (type && option.type !== type) return null;
        return option.value;
      },
      getSubcommand() {
        let splitted = self.usedCommandName.split(" ");
        if (splitted.length === 2) return splitted[1];
        if (splitted.length === 3) return splitted[2];
        return null;
      },
      getSubcommandGroup() {
        let splitted = self.usedCommandName.split(" ");
        if (splitted.length === 2) return splitted[1];
        return null;
      },
    }
  }

  private getOption(name: string): FakeMessageInteractionArgument {
    return this.parsedArgs.get(name)?.value;
  }

  inGuild() {
    return true;
  }

  async deferReply(options: any): Promise<any> {
    if (options.ephemeral) throw new Error("Ephemeral replies are not supported in message commands.");
    if (this.repliedMessage) throw new Error("Already deferred reply.");
    this.repliedMessage = await this.message.reply("Loading...");
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

  async reply(content: any): Promise<any> {
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
}

interface FakeMessageInteractionArgument {
  type: ApplicationCommandOptionType,
  value: any
}