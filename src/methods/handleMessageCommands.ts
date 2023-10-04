import { ApplicationCommandType, ChatInputCommandInteraction, Message, MessagePayload, ApplicationCommandOptionType } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { FakeMessageInteraction } from "../types/other/FakeMessageInteraction";
import { TDBILocaleString } from "../types/other/Locale";

const INTEGER_REGEX = /^-?\d+$/;
const NUMBER_REGEX = /^-?\d+(?:\.\d+)?$/;

export type TDBIMessageCommandArgumentErrorTypes = "MissingRequiredOption" | "MinLength" | "MaxLength" | "InvalidChoice" | "InvalidInteger" | "MinInteger" | "MaxInteger" | "InvalidNumber" | "MinNumber" | "MaxNumber" | "InvalidBoolean" | "InvalidUser" | "InvalidChannel" | "InvalidRole" | "InvalidMentionable" | "InvalidCompleteChoice";

export async function handleMessageCommands(dbi: DBI<NamespaceEnums>, message: Message) {
  const chatInputs = dbi.data.interactions.filter(i => i.type === "ChatInput");
  const prefixes = dbi.config.messageCommands.prefixes ?? [];
  if (!prefixes.length) return;
  const content = message.content;
  const usedPrefix = prefixes.find(p => content.startsWith(p));
  if (!usedPrefix) return;
  const contentWithoutPrefix = content.slice(usedPrefix?.length ?? 0);
  const contentLower = contentWithoutPrefix.toLowerCase();

  let locale: string = message.guild.preferredLocale?.split("-")?.at(0) || dbi.config.defaults.locale as any;
  let usedAlias: string | undefined;
  let chatInput = chatInputs.find(i => {
    let found = contentLower.startsWith(i.name);
    if (found) return true;
    let alias = i.other?.messageCommand?.aliases?.find(a => contentLower.startsWith(a));
    if (alias) {
      usedAlias = alias;
      return true;
    }
    return false;
  });
  let commandName = usedAlias ?? chatInput?.name;

  if (!chatInput) {
    fLoop: for (const [localeInterName, localeData] of dbi.data.interactionLocales) {
      for (const [localeName, translation] of Object.entries(localeData.data || {})) {
        if (contentLower.startsWith(translation.name)) {
          commandName = translation.name;
          locale = localeName;
          chatInput = chatInputs.find(i => i.name === localeData.name);
          break fLoop;
        }
      }
    }
  }

  if (!chatInput) return;

  const interaction = new FakeMessageInteraction(dbi, message, chatInput, locale, commandName, usedPrefix);

  if (chatInput.options.length) {
    let errorType: TDBIMessageCommandArgumentErrorTypes;
    let lastOption;
    let lastValue;
    let lastExtra;
    for (let i = 0; i < chatInput.options.length; i++) {
      const option: any = interaction.dbiChatInputOptions[i];
      const value = interaction.parsedArgs.get(option.name)?.value;

      lastOption = option;
      lastValue = value;
      
      if (option.required && !value) {
        errorType = "MissingRequiredOption";
        break;
      }

      switch (option.type) {
        case ApplicationCommandOptionType.String: {
          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value
            });
            if (!choices.length) choices = await option.onComplete({
              interaction,
              value: ""
            });
            if (choices.length > 20) throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (!choices.find(c => c.name === value || c.value === value)) {
              errorType = "InvalidCompleteChoice";
              break;
            }
            option._choices = choices;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(chatInput.name)?.data;
            const choicesLocaleData = localeData?.[locale as TDBILocaleString]?.options?.[option.name]?.choices;
            if (!option.choices.find(c => c.name === value || c.value === value || choicesLocaleData?.[c.value] === value)) {
              errorType = "InvalidChoice";
              lastExtra = option.choices.map(c => ({ name: choicesLocaleData?.[c.value] ?? c.name, value: c.value }));
              break;
            }
            break;
          }

          if (option.minLength && value.length < option.minLength) {
            errorType = "MinLength";
            break;
          }
          if (option.maxLength && value.length > option.maxLength) {
            errorType = "MaxLength";
            break;
          }

          break;
        }
        case ApplicationCommandOptionType.Integer: {
          let parsedInt = parseInt(value);

          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value
            });
            if (!choices.length) choices = await option.onComplete({
              interaction,
              value: ""
            });
            if (choices.length > 20) throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (!choices.find(c => c.value === parsedInt || c.name === value)) {
              errorType = "InvalidCompleteChoice";
              break;
            }
            option._choices = choices;
            break;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(chatInput.name)?.data;
            const choicesLocaleData = localeData?.[locale as TDBILocaleString]?.options?.[option.name]?.choices;
            if (!option.choices.find(c => c.value === parsedInt || c.name === value || choicesLocaleData?.[c.value] === value)) {
              errorType = "InvalidChoice";
              lastExtra = option.choices.map(c => ({ name: choicesLocaleData?.[c.value] ?? c.name, value: c.value }));
              break;
            }
            break;
          }

          if (!INTEGER_REGEX.test(value)) {
            errorType = "InvalidInteger";
            break;
          }
          
          if (option.minValue && parsedInt < option.minValue) {
            errorType = "MinInteger";
            break;
          }
          if (option.maxValue && parsedInt > option.maxValue) {
            errorType = "MaxInteger";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Number: {
          let parsedFloat = parseFloat(value);

          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value
            });
            if (!choices.length) choices = await option.onComplete({
              interaction,
              value: ""
            });
            if (choices.length > 20) throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (!choices.find(c => c.value === parsedFloat || c.name === value)) {
              errorType = "InvalidCompleteChoice";
              break;
            }
            option._choices = choices;
            break;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(chatInput.name)?.data;
            const choicesLocaleData = localeData?.[locale as TDBILocaleString]?.options?.[option.name]?.choices;
            if (!option.choices.find(c => c.value === parsedFloat || c.name === value || choicesLocaleData?.[c.value] === value)) {
              errorType = "InvalidChoice";
              lastExtra = option.choices.map(c => ({ name: choicesLocaleData?.[c.value] ?? c.name, value: c.value }));
              break;
            }
            break;
          }

          if (!NUMBER_REGEX.test(value)) {
            errorType = "InvalidNumber";
            break;
          }
          if (option.minValue && parsedFloat < option.minValue) {
            errorType = "MinNumber";
            break;
          }
          if (option.maxValue && parsedFloat > option.maxValue) {
            errorType = "MaxNumber";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Boolean: {
          let boolKeys = Object.keys(dbi.config.messageCommands.typeAliases.booleans);
          if (!boolKeys.includes(value.toLowerCase())) {
            errorType = "InvalidBoolean";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.User: {
          if (!interaction.options.getUser(value)) {
            errorType = "InvalidUser";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Channel: {
          if (!interaction.options.getChannel(value, null, option.channelTypes)) {
            errorType = "InvalidChannel";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Role: {
          if (!interaction.options.getRole(value)) {
            errorType = "InvalidRole";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Mentionable: {
          if (!interaction.options.getMentionable(value)) {
            errorType = "InvalidMentionable";
            break;
          }
          break;
        }
      }

      if (errorType) break;

    }

    if (errorType) {
      let res = await dbi.events.trigger("messageCommandArgumentError", {
        interaction,
        message,
        error: {
          type: errorType,
          option: lastOption,
          extra: lastExtra
        },
        value: lastValue
      });
      if (!res) return;
    }
  }


  dbi.data.clients.first().client.emit("interactionCreate", interaction as any);
}