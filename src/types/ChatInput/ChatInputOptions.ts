import Discord from "discord.js";
import { IDBIBaseExecuteCtx } from "../Interaction";

type TValueName<T> = { value: T, name: string };
type TNameDescription = { name: string, description: string };

type TMinMaxLength = { maxLength?: string, minLength?: string };
type TMinMaxValue = { maxValue?: number, minValue?: number };

export interface IDBICompleteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.AutocompleteInteraction;
}

export class DBIChatInputOptions {
  static stringAutocomplete(cfg: TNameDescription & TMinMaxLength & { onComplete(ctx: IDBICompleteCtx): Promise<TValueName<string>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxLength: cfg.maxLength,
      minLength: cfg.minLength
    };
  }
  static stringChoices(cfg: TNameDescription & TMinMaxLength & { choices: TValueName<string>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxLength: cfg.maxLength,
      minLength: cfg.minLength
    };
  }

  static string(cfg: TNameDescription & TMinMaxLength) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      description: cfg.description,
      maxLength: cfg.maxLength,
      minLength: cfg.minLength
    };
  }

  static numberAutocomplete(cfg: TNameDescription & TMinMaxValue & { onComplete(ctx: IDBICompleteCtx): Promise<TValueName<number>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static numberChoices(cfg: TNameDescription & TMinMaxValue & { choices: TValueName<number>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static number(cfg: TNameDescription & TMinMaxValue) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static integerAutocomplete(cfg: TNameDescription & TMinMaxValue & { onComplete(ctx: IDBICompleteCtx): Promise<TValueName<number>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static integerChoices(cfg: TNameDescription & TMinMaxValue & { choices: TValueName<number>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static integer(cfg: TNameDescription & TMinMaxValue) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      minValue: cfg.minValue
    };
  }

  static boolean(cfg: TNameDescription) {
    return {
      type: Discord.ApplicationCommandOptionType.Boolean,
      name: cfg.name,
      description: cfg.description
    };
  }

  static attachment(cfg: TNameDescription) {
    return {
      type: Discord.ApplicationCommandOptionType.Attachment,
      name: cfg.name,
      description: cfg.description
    };
  }

  static channel(cfg: TNameDescription & { channelTypes: Discord.ChannelType[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Channel,
      name: cfg.name,
      description: cfg.description,
      channelTypes: cfg.channelTypes
    };
  }

  static mentionable(cfg: TNameDescription) {
    return {
      type: Discord.ApplicationCommandOptionType.Mentionable,
      name: cfg.name,
      description: cfg.description
    };
  }

  static user(cfg: TNameDescription) {
    return {
      type: Discord.ApplicationCommandOptionType.User,
      name: cfg.name,
      description: cfg.description
    };
  }
}