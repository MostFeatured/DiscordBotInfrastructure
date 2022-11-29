import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import { IDBIBaseExecuteCtx } from "../Interaction";

export type TDBIValueName<T> = { value: T, name: string };
export type TDBIBaseOption = { name: string, description: string, required?: boolean };

export type TDBIMinMaxLength = { maxLength?: number, minLength?: number };
export type TDBIMinMaxValue = { maxValue?: number, minValue?: number };

export interface IDBICompleteCtx<TNamespace extends NamespaceEnums, TValueType = string | number> extends IDBIBaseExecuteCtx<TNamespace> { 
  interaction: Discord.AutocompleteInteraction;
  value: TValueType;
}

export class DBIChatInputOptions<TNamespace extends NamespaceEnums> {
  dbi: DBI<TNamespace>;
  constructor(dbi: DBI<TNamespace>) {
    this.dbi = dbi;
  }
  stringAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxLength & { onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<string>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxLength: cfg.maxLength,
      max_length: cfg.maxLength,
      minLength: cfg.minLength,
      min_length: cfg.minLength,
      required: cfg.required
    };
  }
  stringChoices(cfg: TDBIBaseOption & TDBIMinMaxLength & { choices: TDBIValueName<string>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxLength: cfg.maxLength,
      max_length: cfg.maxLength,
      minLength: cfg.minLength,
      min_length: cfg.minLength,
      required: cfg.required
    };
  }

  string(cfg: TDBIBaseOption & TDBIMinMaxLength) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      description: cfg.description,
      maxLength: cfg.maxLength,
      max_length: cfg.maxLength,
      minLength: cfg.minLength,
      min_length: cfg.minLength,
      required: cfg.required
    };
  }

  numberAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxValue & { onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<number>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  numberChoices(cfg: TDBIBaseOption & TDBIMinMaxValue & { choices: TDBIValueName<number>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  number(cfg: TDBIBaseOption & TDBIMinMaxValue) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  integerAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxValue & { onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<number>[]> }) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      autocomplete: true,
      onComplete: cfg.onComplete,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  integerChoices(cfg: TDBIBaseOption & TDBIMinMaxValue & { choices: TDBIValueName<number>[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  integer(cfg: TDBIBaseOption & TDBIMinMaxValue) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required
    };
  }

  boolean(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.Boolean,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required
    };
  }

  attachment(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.Attachment,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required
    };
  }

  channel(cfg: TDBIBaseOption & { channelTypes: Discord.ChannelType[] }) {
    return {
      type: Discord.ApplicationCommandOptionType.Channel,
      name: cfg.name,
      description: cfg.description,
      channelTypes: cfg.channelTypes,
      channel_types: cfg.channelTypes,
      required: cfg.required
    };
  }

  role(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.Role,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required
    }
  }

  mentionable(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.Mentionable,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required
    };
  }

  user(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.User,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required
    };
  }
}