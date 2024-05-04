import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  Message,
  MessagePayload,
  ApplicationCommandOptionType,
} from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
import { FakeMessageInteraction } from "../types/other/FakeMessageInteraction";
import { TDBILocaleString } from "../types/other/Locale";

const INTEGER_REGEX = /^-?\d+$/;
const NUMBER_REGEX = /^-?\d+(?:\.\d+)?$/;

export type TDBIMessageCommandArgumentErrorTypes =
  | "MissingRequiredOption"
  | "MinLength"
  | "MaxLength"
  | "InvalidChoice"
  | "InvalidInteger"
  | "MinInteger"
  | "MaxInteger"
  | "InvalidNumber"
  | "MinNumber"
  | "MaxNumber"
  | "InvalidBoolean"
  | "InvalidUser"
  | "InvalidChannel"
  | "InvalidRole"
  | "InvalidMentionable"
  | "InvalidCompleteChoice";

export async function handleMessageCommands(
  dbi: DBI<NamespaceEnums>,
  message: Message
) {
  const chatInputs = dbi.data.interactions.filter(
    (i) => i.type === "ChatInput"
  );
  const prefixes = await dbi.config.messageCommands.prefixes({ message });
  if (!prefixes?.length) return;
  const content = message.content;
  const usedPrefix = prefixes.find((p) => content.startsWith(p));
  if (!usedPrefix) return;
  const contentWithoutPrefix = content.slice(usedPrefix?.length ?? 0);
  const contentLower = contentWithoutPrefix.toLowerCase();

  let locale: string =
    message.guild.preferredLocale?.split("-")?.at(0) ||
    (dbi.config.defaults.locale as any);
  let usedAlias: string | undefined;
  let chatInput = chatInputs.find((i) => {
    let found = contentLower.startsWith(i.name);
    if (found) return true;
    let alias = i.other?.messageCommand?.aliases?.find((a) =>
      contentLower.startsWith(a)
    );
    if (alias) {
      usedAlias = alias;
      return true;
    }
    return false;
  });
  let commandName = usedAlias ?? chatInput?.name;

  if (!chatInput) {
    fLoop: for (const [localeInterName, localeData] of dbi.data
      .interactionLocales) {
      for (const [localeName, translation] of Object.entries(
        localeData.data || {}
      )) {
        if (contentLower.startsWith(translation.name)) {
          commandName = translation.name;
          locale = localeName;
          chatInput = chatInputs.find((i) => i.name === localeData.name);
          break fLoop;
        }
      }
    }
  }

  if (!chatInput) return;

  const interaction = new FakeMessageInteraction(
    dbi,
    message,
    chatInput as any,
    locale,
    commandName,
    usedPrefix
  );

  const builtLocale = {
    user:
      dbi.data.locales.get(interaction.locale) ||
      dbi.data.locales.get(dbi.config.defaults.locale),
    guild: message.guild?.preferredLocale
      ? dbi.data.locales.get(
        message.guild?.preferredLocale?.split("-")?.at(0)
      ) || dbi.data.locales.get(dbi.config.defaults.locale)
      : null,
  };

  const { defaultMemberPermissions, directMessages } = chatInput as any;

  if (typeof directMessages !== "undefined" && !directMessages && !message.guild) {
    const res = await dbi.events.trigger(
      "messageCommandDirectMessageUsageError", {
      interaction,
      message,
      locale: builtLocale,
      dbiInteraction: chatInput
    });
    if (!res) return;
  }

  if (Array.isArray(defaultMemberPermissions) && message.guild && message.member) {
    const perms = message.member.permissions.toArray();
    if (!defaultMemberPermissions.every((p) => perms.includes(p))) {
      const res = await dbi.events.trigger(
        "messageCommandDefaultMemberPermissionsError", {
        interaction,
        message,
        locale: builtLocale,
        dbiInteraction: chatInput,
        permissions: defaultMemberPermissions
      });
      if (!res) return;
    }
  }

  if (chatInput.options.length) {
    let errorType: TDBIMessageCommandArgumentErrorTypes;
    let lastOption: any;
    let lastValue: any;
    let lastExtra: any;
    let lastIndex: number;
    for (let i = 0; i < chatInput.options.length; i++) {
      lastIndex = i;
      const option: any = interaction.dbiChatInputOptions[i];
      const value = interaction.parsedArgs.get(option.name)?.value;

      lastOption = option;
      lastValue = value;

      switch (option.type) {
        case ApplicationCommandOptionType.String: {
          if (!option.required && !value) break;

          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value,
            });
            if (!choices.length)
              choices = await option.onComplete({
                interaction,
                value: "",
              });
            if (choices.length > 20)
              throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (!choices.find((c) => c.name === value || c.value === value)) {
              if (value) {
                errorType = "InvalidCompleteChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
            }
            option._choices = choices;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(
              chatInput.name
            )?.data;
            const choicesLocaleData =
              localeData?.[locale as TDBILocaleString]?.options?.[option.name]
                ?.choices;
            if (
              !option.choices.find(
                (c) =>
                  c.name === value ||
                  c.value === value ||
                  (choicesLocaleData?.[c.value] &&
                    choicesLocaleData?.[c.value] === value)
              )
            ) {
              lastExtra = option.choices.map((c) => ({
                name: choicesLocaleData?.[c.value] ?? c.name,
                value: c.value,
              }));
              if (value) {
                errorType = "InvalidChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
            }
            break;
          }

          if (option.required && !value) {
            errorType = "MissingRequiredOption";
            break;
          }
          if (option.minLength && value?.length < option.minLength) {
            errorType = "MinLength";
            break;
          }
          if (option.maxLength && value?.length > option.maxLength) {
            errorType = "MaxLength";
            break;
          }

          break;
        }
        case ApplicationCommandOptionType.Integer: {
          if (!option.required && !value) break;

          let parsedInt = parseInt(value);

          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value,
            });
            if (!choices.length)
              choices = await option.onComplete({
                interaction,
                value: "",
              });
            if (choices.length > 20)
              throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (
              !choices.find((c) => c.value === parsedInt || c.name === value)
            ) {
              if (value) {
                errorType = "InvalidCompleteChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
            }
            option._choices = choices;
            break;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(
              chatInput.name
            )?.data;
            const choicesLocaleData =
              localeData?.[locale as TDBILocaleString]?.options?.[option.name]
                ?.choices;
            if (
              !option.choices.find(
                (c) =>
                  c.value === parsedInt ||
                  c.name === value ||
                  (choicesLocaleData?.[c.value] &&
                    choicesLocaleData?.[c.value] === value)
              )
            ) {
              lastExtra = option.choices.map((c) => ({
                name: choicesLocaleData?.[c.value] ?? c.name,
                value: c.value,
              }));
              if (value) {
                errorType = "InvalidChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
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
          if (!option.required && !value) break;

          let parsedFloat = parseFloat(value);

          if (option.autocomplete && option.onComplete) {
            let choices = await option.onComplete({
              interaction,
              value,
            });
            if (!choices.length)
              choices = await option.onComplete({
                interaction,
                value: "",
              });
            if (choices.length > 20)
              throw new Error("Autocomplete returned more than 20 choices.");
            lastExtra = choices;
            if (
              !choices.find((c) => c.value === parsedFloat || c.name === value)
            ) {
              if (value) {
                errorType = "InvalidCompleteChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
            }
            option._choices = choices;
            break;
          }

          if (option.choices) {
            const localeData = dbi.data.interactionLocales.get(
              chatInput.name
            )?.data;
            const choicesLocaleData =
              localeData?.[locale as TDBILocaleString]?.options?.[option.name]
                ?.choices;
            if (
              !option.choices.find(
                (c) =>
                  c.value === parsedFloat ||
                  c.name === value ||
                  (choicesLocaleData?.[c.value] &&
                    choicesLocaleData?.[c.value] === value)
              )
            ) {
              lastExtra = option.choices.map((c) => ({
                name: choicesLocaleData?.[c.value] ?? c.name,
                value: c.value,
              }));
              if (value) {
                errorType = "InvalidChoice";
                break;
              } else if (option.required && !value) {
                errorType = "MissingRequiredOption";
                break;
              }
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
          let boolKeys = Object.keys(
            dbi.config.messageCommands.typeAliases.booleans
          );
          if (option.required && !boolKeys.includes(value?.toLowerCase?.())) {
            errorType = "InvalidBoolean";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.User: {
          await message.client.users
            .fetch(interaction.options.getUserId(option.name))
            .catch(() => { });
          if (option.required && !interaction.options.getUser(option.name)) {
            errorType = "InvalidUser";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Channel: {
          await message.client.channels
            .fetch(interaction.options.getChannelId(option.name))
            .catch(() => { });
          if (
            option.required &&
            !interaction.options.getChannel(
              option.name,
              null,
              option.channelTypes
            )
          ) {
            errorType = "InvalidChannel";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Role: {
          await message.guild.roles
            .fetch(interaction.options.getRoleId(option.name))
            .catch(() => { });
          if (option.required && !interaction.options.getRole(option.name)) {
            errorType = "InvalidRole";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Mentionable: {
          let mentionableId = interaction.options.getMentionableId(option.name);
          await message.guild.roles.fetch(mentionableId).catch(() => { });
          await message.client.channels.fetch(mentionableId).catch(() => { });
          await message.client.users.fetch(mentionableId).catch(() => { });
          if (
            option.required &&
            !interaction.options.getMentionable(option.name)
          ) {
            errorType = "InvalidMentionable";
            break;
          }
          break;
        }
        case ApplicationCommandOptionType.Attachment: {
          if (option.required && !value) {
            errorType = "MissingRequiredOption";
          }
          break;
        }
      }

      if (errorType) {
        break;
      } else {
        lastExtra = null;
        lastIndex = null;
        lastOption = null;
        lastValue = null;
      }
    }

    if (errorType) {
      let res = await dbi.events.trigger("messageCommandArgumentError", {
        interaction,
        message,
        locale: builtLocale,
        error: {
          type: errorType,
          option: lastOption,
          extra: lastExtra,
          index: lastIndex,
        },
        value: lastValue,
        dbiInteraction: chatInput,
      });
      if (!res) return;
    }
  }

  interaction.init();
  dbi.data.clients.first().client.emit("interactionCreate", interaction as any);
}
