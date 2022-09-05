import Discord from "discord.js";
import { IDBIBaseExecuteCtx } from "../Interaction";
declare type TValueName<T> = {
    value: T;
    name: string;
};
declare type TNameDescription = {
    name: string;
    description: string;
    required?: boolean;
};
declare type TMinMaxLength = {
    maxLength?: number;
    minLength?: number;
};
declare type TMinMaxValue = {
    maxValue?: number;
    minValue?: number;
};
export interface IDBICompleteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.AutocompleteInteraction;
    value: string | number;
}
export declare class DBIChatInputOptions {
    static stringAutocomplete(cfg: TNameDescription & TMinMaxLength & {
        onComplete(ctx: IDBICompleteCtx): Promise<TValueName<string>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx) => Promise<TValueName<string>[]>;
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    static stringChoices(cfg: TNameDescription & TMinMaxLength & {
        choices: TValueName<string>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TValueName<string>[];
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    static string(cfg: TNameDescription & TMinMaxLength): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxLength: number;
        minLength: number;
        required: boolean;
    };
    static numberAutocomplete(cfg: TNameDescription & TMinMaxValue & {
        onComplete(ctx: IDBICompleteCtx): Promise<TValueName<number>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx) => Promise<TValueName<number>[]>;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static numberChoices(cfg: TNameDescription & TMinMaxValue & {
        choices: TValueName<number>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TValueName<number>[];
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static number(cfg: TNameDescription & TMinMaxValue): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static integerAutocomplete(cfg: TNameDescription & TMinMaxValue & {
        onComplete(ctx: IDBICompleteCtx): Promise<TValueName<number>[]>;
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        autocomplete: boolean;
        onComplete: (ctx: IDBICompleteCtx) => Promise<TValueName<number>[]>;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static integerChoices(cfg: TNameDescription & TMinMaxValue & {
        choices: TValueName<number>[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        choices: TValueName<number>[];
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static integer(cfg: TNameDescription & TMinMaxValue): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        maxValue: number;
        minValue: number;
        required: boolean;
    };
    static boolean(cfg: TNameDescription): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    static attachment(cfg: TNameDescription): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    static channel(cfg: TNameDescription & {
        channelTypes: Discord.ChannelType[];
    }): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        channelTypes: Discord.ChannelType[];
        required: boolean;
    };
    static mentionable(cfg: TNameDescription): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
    static user(cfg: TNameDescription): {
        type: Discord.ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    };
}
export {};
//# sourceMappingURL=ChatInputOptions.d.ts.map