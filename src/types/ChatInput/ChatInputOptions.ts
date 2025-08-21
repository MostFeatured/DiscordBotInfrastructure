import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import { IDBIBaseExecuteCtx } from "../Interaction";

export type TDBIValueName<T> = { value: T; name: string };
export type TDBIBaseOption = {
  name: string;
  description: string;
  required?: boolean;
};

export type TDBIMinMaxLength = { maxLength?: number; minLength?: number };
export type TDBIMinMaxValue = { maxValue?: number; minValue?: number };

export type TDBIValidator<
  TExtends,
  TValue,
  TStep extends string,
  TExpectedResponse = boolean
> = {
  validate?(
    cfg: TExtends & { value: TValue; step: TStep }
  ): Promise<TExpectedResponse> | TExpectedResponse;
};

export interface IDBIValuedInteraction<
  TNamespace extends NamespaceEnums,
  TInteractionType extends Discord.Interaction,
  TValueType = string | number
> extends Omit<IDBIBaseExecuteCtx<TNamespace>, 'interaction'> {
  value: TValueType;
  interaction: TInteractionType;
}

export type TDBICompleteCtx<
  TNamespace extends NamespaceEnums,
  TValueType = string | number
> = IDBIValuedInteraction<
  TNamespace,
  Discord.AutocompleteInteraction,
  TValueType
>;

export type TDBIValidateCtx<
  TNamespace extends NamespaceEnums,
  TValueType = string | number
> = IDBIValuedInteraction<TNamespace, Discord.Interaction, TValueType>;

export type TDBICompleter<
  TNamespace extends NamespaceEnums,
  TValueType extends number | string
> = {
  onComplete(
    ctx: TDBICompleteCtx<TNamespace, string>
  ): Promise<TDBIValueName<TValueType>[]> | TDBIValueName<TValueType>[];
};

export class DBIChatInputOptions<TNamespace extends NamespaceEnums> {
  dbi: DBI<TNamespace>;
  constructor(dbi: DBI<TNamespace>) {
    this.dbi = dbi;
  }
  stringAutocomplete(
    cfg: TDBIBaseOption &
      TDBIMinMaxLength & {
        messageCommands?: { rest?: boolean };
      } & TDBIValidator<
        TDBIValidateCtx<TNamespace, string>,
        string,
        "Autocomplete" | "Result",
        boolean | TDBIValueName<string>
      > &
      TDBICompleter<TNamespace, string>
  ) {
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
      required: cfg.required,
      validate: cfg.validate,
    };
  }
  stringChoices(
    cfg: TDBIBaseOption &
      TDBIMinMaxLength & {
        choices: TDBIValueName<string>[];
        messageCommands?: { rest?: boolean };
      } & TDBIValidator<
        TDBIValidateCtx<TNamespace, string>,
        string,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxLength: cfg.maxLength,
      max_length: cfg.maxLength,
      minLength: cfg.minLength,
      min_length: cfg.minLength,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  string(
    cfg: TDBIBaseOption &
      TDBIMinMaxLength & {
        messageCommands?: { rest?: boolean };
      } & TDBIValidator<
        TDBIValidateCtx<TNamespace, string>,
        string,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.String,
      name: cfg.name,
      description: cfg.description,
      maxLength: cfg.maxLength,
      max_length: cfg.maxLength,
      minLength: cfg.minLength,
      min_length: cfg.minLength,
      required: cfg.required,
      messageCommands: cfg.messageCommands,
      validate: cfg.validate,
    };
  }

  numberAutocomplete(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Autocomplete" | "Result",
        boolean | TDBIValueName<number>
      > &
      TDBICompleter<TNamespace, number>
  ) {
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
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  numberChoices(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue & { choices: TDBIValueName<number>[] } & TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  number(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Number,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  integerAutocomplete(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Autocomplete" | "Result",
        boolean | TDBIValueName<number>
      > &
      TDBICompleter<TNamespace, number>
  ) {
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
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  integerChoices(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue & { choices: TDBIValueName<number>[] } & TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      choices: cfg.choices,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  integer(
    cfg: TDBIBaseOption &
      TDBIMinMaxValue &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, number>,
        number,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Integer,
      name: cfg.name,
      description: cfg.description,
      maxValue: cfg.maxValue,
      max_value: cfg.maxValue,
      minValue: cfg.minValue,
      min_value: cfg.minValue,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  boolean(cfg: TDBIBaseOption) {
    return {
      type: Discord.ApplicationCommandOptionType.Boolean,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required,
    };
  }

  attachment(
    cfg: TDBIBaseOption &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, Discord.Attachment>,
        Discord.Attachment,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Attachment,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required,
    };
  }

  channel(
    cfg: TDBIBaseOption & {
      channelTypes: Discord.ChannelType[];
    } & TDBIValidator<
      TDBIValidateCtx<TNamespace, Discord.Channel>,
      Discord.Channel,
      "Result",
      boolean
    >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Channel,
      name: cfg.name,
      description: cfg.description,
      channelTypes: cfg.channelTypes,
      channel_types: cfg.channelTypes,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  role(
    cfg: TDBIBaseOption &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, Discord.Role>,
        Discord.Role,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Role,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  mentionable(
    cfg: TDBIBaseOption &
      TDBIValidator<
        TDBIValidateCtx<
          TNamespace,
          Discord.Role | Discord.Channel | Discord.User
        >,
        Discord.Role | Discord.Channel | Discord.User,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.Mentionable,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required,
      validate: cfg.validate,
    };
  }

  user(
    cfg: TDBIBaseOption &
      TDBIValidator<
        TDBIValidateCtx<TNamespace, Discord.User>,
        Discord.User,
        "Result",
        boolean
      >
  ) {
    return {
      type: Discord.ApplicationCommandOptionType.User,
      name: cfg.name,
      description: cfg.description,
      required: cfg.required,
      validate: cfg.validate,
    };
  }
}
