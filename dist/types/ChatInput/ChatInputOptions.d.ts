import Discord from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import { IDBIBaseExecuteCtx } from "../Interaction";
export declare type TDBIValueName<T> = {
    value: T;
    name: string;
};
export declare type TDBIBaseOption = {
    name: string;
    description: string;
    required?: boolean;
};
export declare type TDBIMinMaxLength = {
    maxLength?: number;
    minLength?: number;
};
export declare type TDBIMinMaxValue = {
    maxValue?: number;
    minValue?: number;
};
export interface IDBICompleteCtx<TNamespace extends NamespaceEnums, TValueType = string | number> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.AutocompleteInteraction;
    value: TValueType;
}
export declare class DBIChatInputOptions<TNamespace extends NamespaceEnums> {
    dbi: DBI<TNamespace>;
    constructor(dbi: DBI<TNamespace>);
    stringAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxLength & {
        onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<string>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx<TNamespace, string>) => Promise<TDBIValueName<string>[]>;
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    stringChoices(cfg: TDBIBaseOption & TDBIMinMaxLength & {
        choices: TDBIValueName<string>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TDBIValueName<string>[];
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    string(cfg: TDBIBaseOption & TDBIMinMaxLength): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    numberAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxValue & {
        onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<number>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx<TNamespace, string>) => Promise<TDBIValueName<number>[]>;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    numberChoices(cfg: TDBIBaseOption & TDBIMinMaxValue & {
        choices: TDBIValueName<number>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TDBIValueName<number>[];
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    number(cfg: TDBIBaseOption & TDBIMinMaxValue): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    integerAutocomplete(cfg: TDBIBaseOption & TDBIMinMaxValue & {
        onComplete(ctx: IDBICompleteCtx<TNamespace, string>): Promise<TDBIValueName<number>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx<TNamespace, string>) => Promise<TDBIValueName<number>[]>;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    integerChoices(cfg: TDBIBaseOption & TDBIMinMaxValue & {
        choices: TDBIValueName<number>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TDBIValueName<number>[];
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    integer(cfg: TDBIBaseOption & TDBIMinMaxValue): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    boolean(cfg: TDBIBaseOption): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    attachment(cfg: TDBIBaseOption): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    channel(cfg: TDBIBaseOption & {
        channelTypes: Discord.ChannelType[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        channelTypes: Discord.ChannelType[];
        channel_types: Discord.ChannelType[];
        required: boolean;
    };
    role(cfg: TDBIBaseOption): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    mentionable(cfg: TDBIBaseOption): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    user(cfg: TDBIBaseOption): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
}
//# sourceMappingURL=ChatInputOptions.d.ts.map