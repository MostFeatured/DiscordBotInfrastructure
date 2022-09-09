"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBIChatInputOptions = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
class DBIChatInputOptions {
    static stringAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
            name: cfg.name,
            autocomplete: true,
            onComplete: cfg.onComplete,
            description: cfg.description,
            maxLength: cfg.maxLength,
            minLength: cfg.minLength,
            required: cfg.required
        };
    }
    static stringChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
            name: cfg.name,
            choices: cfg.choices,
            description: cfg.description,
            maxLength: cfg.maxLength,
            minLength: cfg.minLength,
            required: cfg.required
        };
    }
    static string(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.String,
            name: cfg.name,
            description: cfg.description,
            maxLength: cfg.maxLength,
            minLength: cfg.minLength,
            required: cfg.required
        };
    }
    static numberAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
            name: cfg.name,
            autocomplete: true,
            onComplete: cfg.onComplete,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static numberChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
            name: cfg.name,
            choices: cfg.choices,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static number(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Number,
            name: cfg.name,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static integerAutocomplete(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
            name: cfg.name,
            autocomplete: true,
            onComplete: cfg.onComplete,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static integerChoices(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
            name: cfg.name,
            choices: cfg.choices,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static integer(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Integer,
            name: cfg.name,
            description: cfg.description,
            maxValue: cfg.maxValue,
            minValue: cfg.minValue,
            required: cfg.required
        };
    }
    static boolean(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Boolean,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    static attachment(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Attachment,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    static channel(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Channel,
            name: cfg.name,
            description: cfg.description,
            channelTypes: cfg.channelTypes,
            required: cfg.required
        };
    }
    static role(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Role,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    static mentionable(cfg) {
        return {
            type: discord_js_1.default.ApplicationCommandOptionType.Mentionable,
            name: cfg.name,
            description: cfg.description,
            required: cfg.required
        };
    }
    static user(cfg) {
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