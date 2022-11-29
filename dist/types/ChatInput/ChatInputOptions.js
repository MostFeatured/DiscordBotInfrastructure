"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIChatInputOptions = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
class DBIChatInputOptions {
    dbi;
    constructor(dbi) {
        this.dbi = dbi;
    }
    stringAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
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
    stringChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
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
    string(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
            name: cfg.name,
            description: cfg.description,
            maxLength: cfg.maxLength,
            max_length: cfg.maxLength,
            minLength: cfg.minLength,
            min_length: cfg.minLength,
            required: cfg.required
        };
    }
    numberAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
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
    numberChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
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
    number(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
            name: cfg.name,
            description: cfg.description,
            maxValue: cfg.maxValue,
            max_value: cfg.maxValue,
            minValue: cfg.minValue,
            min_value: cfg.minValue,
            required: cfg.required
        };
    }
    integerAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
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
    integerChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
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
    integer(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
            name: cfg.name,
            description: cfg.description,
            maxValue: cfg.maxValue,
            max_value: cfg.maxValue,
            minValue: cfg.minValue,
            min_value: cfg.minValue,
            required: cfg.required
        };
    }
    boolean(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Boolean,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    attachment(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Attachment,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    channel(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Channel,
            name: cfg.name,
            description: cfg.description,
            channelTypes: cfg.channelTypes,
            channel_types: cfg.channelTypes,
            required: cfg.required
        };
    }
    role(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Role,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    mentionable(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Mentionable,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    user(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.User,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
}
exports.DBIChatInputOptions = DBIChatInputOptions;
//# sourceMappingURL=ChatInputOptions.js.map