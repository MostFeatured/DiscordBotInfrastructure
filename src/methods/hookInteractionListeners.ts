import { DBI } from "../DBI";
import Discord, { CommandInteractionOption } from "discord.js";
import { parseCustomId } from "../utils/customId";
import { NamespaceEnums } from "../../generated/namespaceData";

const componentTypes = [
  "Button",
  "StringSelectMenu",
  "UserSelectMenu",
  "RoleSelectMenu",
  "ChannelSelectMenu",
  "MentionableSelectMenu",
  "Modal",
];

export function hookInteractionListeners(dbi: DBI<NamespaceEnums>): () => any {
  async function handle(inter: Discord.Interaction<"cached">) {
    const dbiInter =
      (inter as any).dbiChatInput ??
      dbi.data.interactions.find((dbiInter) => {
        let isUsesCustomId =
          inter.isButton() || inter.isAnySelectMenu() || inter.isModalSubmit();
        let parsedId = isUsesCustomId
          ? parseCustomId(dbi, (inter as any).customId)
          : null;
        return (
          (dbiInter.type == "ChatInput" &&
            (inter.isChatInputCommand() || inter.isAutocomplete()) &&
            dbiInter.name ==
            [
              inter.commandName,
              inter.options.getSubcommandGroup(false),
              inter.options.getSubcommand(false),
            ]
              .filter((i) => !!i)
              .join(" "))
          ||
          ((dbiInter.type == "MessageContextMenu" || dbiInter.type == "UserContextMenu") &&
            (inter.isMessageContextMenuCommand() ||
              inter.isUserContextMenuCommand()) &&
            inter.commandName == dbiInter.name)
          ||
          (componentTypes.includes(dbiInter.type) &&
            isUsesCustomId &&
            parsedId?.name == dbiInter.name)
          ||
          (parsedId?.v2 && dbiInter.type == "HTMLComponentsV2" && parsedId?.name == dbiInter.name)
        );
      });

    if (!dbiInter) return;

    let userLocaleName = inter.locale.split("-")[0];
    let userLocale = dbi.data.locales.has(userLocaleName)
      ? dbi.data.locales.get(userLocaleName)
      : dbi.data.locales.get(dbi.config.defaults.locale.name);

    let guildLocaleName = inter.guild
      ? inter.guild.preferredLocale.split("-")[0]
      : null;
    let guildLocale = guildLocaleName
      ? dbi.data.locales.has(guildLocaleName)
        ? dbi.data.locales.get(guildLocaleName)
        : dbi.data.locales.get(dbi.config.defaults.locale.name)
      : null;

    let locale = {
      user: userLocale,
      guild: guildLocale,
    };

    let parsedId = inter.isButton() || inter.isAnySelectMenu() || inter.isModalSubmit()
      ? parseCustomId(dbi, inter.customId)
      : undefined;

    let data = parsedId?.data;
    let v2 = parsedId?.v2 || false;

    let other = {};

    if (
      !(await dbi.events.trigger("beforeInteraction", {
        dbi,
        interaction: inter,
        locale,
        setRateLimit,
        data,
        other,
        dbiInteraction: dbiInter,
        v2
      }))
    )
      return;

    if (inter.isAutocomplete()) {
      let focussed = inter.options.getFocused(true);
      let option = (dbiInter.options as any[]).find(
        (i) => i.name == focussed.name
      );
      if (option?.validate) {
        const res = await option.validate({
          value: focussed.value,
          interaction: inter,
          dbiInteraction: dbiInter,
          dbi,
          data,
          other,
          locale,
          step: "Autocomplete",
          v2,
        });

        if (Array.isArray(res) && res.length > 0) {
          await inter.respond(res);
          return;
        }

        if (res !== true) return;
      }

      if (option?.onComplete) {
        let response = await option.onComplete({
          value: focussed.value,
          interaction: inter,
          dbiInteraction: dbiInter,
          dbi,
          data,
          other,
          locale,
          v2
        });
        await inter.respond(response);
      }
      return;
    }

    let rateLimitKeyMap = {
      User: `${dbiInter.name}_${inter.user.id}`,
      Channel: `${dbiInter.name}_${inter.channelId || "Channel"}`,
      Guild: `${dbiInter.name}_${inter.guildId || "Guild"}`,
      Member: `${dbiInter.name}_${inter.user.id}_${inter.guildId || "Guild"}`,
      Message: `${dbiInter.name}_${(inter as any)?.message?.id}`,
    };

    for (const type in rateLimitKeyMap) {
      // @ts-ignore
      let key = `RateLimit["${rateLimitKeyMap[type]}"]`;
      let val = await dbi.config.store.get(key);
      if (val && Date.now() > val.at + val.duration) {
        await dbi.config.store.delete(key);
        val = null;
      }
      if (val) {
        if (
          (await dbi.events.trigger("interactionRateLimit", {
            dbi,
            interaction: inter,
            dbiInteraction: dbiInter,
            locale,
            data,
            rateLimit: {
              type: key,
              ...val,
            },
            v2
          })) === true
        )
          return;
      }
    }

    async function setRateLimit(type: string, duration: number) {
      // @ts-ignore
      await dbi.config.store.set(`RateLimit["${rateLimitKeyMap[type]}"]`, {
        at: Date.now(),
        duration,
      });
    }

    for (const rateLimit of dbiInter.rateLimits) {
      await setRateLimit(rateLimit.type, rateLimit.duration);
    }

    if (inter.isChatInputCommand()) {
      let dcOptions = (inter.options as any)
        ._hoistedOptions as CommandInteractionOption[];
      let dbiOptions = dbiInter.options as any[];
      for (const dcOption of dcOptions) {
        const dbiOption = dbiOptions.find((i) => i.name == dcOption.name);
        if (dbiOption?.validate) {
          const res = await dbiOption.validate({
            value:
              dbiOption.type === Discord.ApplicationCommandOptionType.Attachment
                ? dcOption.attachment
                : dbiOption.type ===
                  Discord.ApplicationCommandOptionType.Channel
                  ? dcOption.channel
                  : dbiOption.type === Discord.ApplicationCommandOptionType.Role
                    ? dcOption.role
                    : dbiOption.type === Discord.ApplicationCommandOptionType.User
                      ? dcOption.user
                      : dcOption.value,
            interaction: inter,
            dbiInteraction: dbiInter,
            dbi,
            data,
            other,
            locale,
            step: "Result",
          });
          if (res !== true) return;
        }
      }
    }

    let arg = {
      // @ts-ignore
      dbi,
      // @ts-ignore
      interaction: inter as any,
      // @ts-ignore
      dbiInteraction: dbiInter,
      // @ts-ignore
      locale,
      // @ts-ignore
      setRateLimit,
      // @ts-ignore
      data,
      // @ts-ignore
      other,
      v2
    };


    if (dbiInter.type === "HTMLComponentsV2") {
      if (dbi.config.strict) {
        // @ts-ignore
        await dbiInter.onExecute?.(arg);

        const elementName = data.shift();
        dbiInter.handlers.forEach((handler) => {
          if (handler.name === elementName) {
            handler.onExecute(arg);
          }
        });
      } else {
        try {
          // @ts-ignore
          await dbiInter.onExecute?.(arg);

          const elementName = data.shift();
          dbiInter.handlers.forEach((handler) => {
            if (handler.name === elementName) {
              handler.onExecute(arg);
            }
          });
        } catch (error) {
          // @ts-ignore
          await dbi.events.trigger(
            "interactionError",
            Object.assign(arg, { error })
          );
        }
      }
    } else {
      if (dbi.config.strict) {
        // @ts-ignore
        await dbiInter.onExecute(arg);
      } else {
        try {
          // @ts-ignore
          await dbiInter.onExecute(arg);
        } catch (error) {
          // @ts-ignore
          await dbi.events.trigger(
            "interactionError",
            Object.assign(arg, { error })
          );
        }
      }
    }

    // @ts-ignore
    dbi.events.trigger("afterInteraction", {
      dbi,
      interaction: inter,
      dbiInteraction: dbiInter,
      locale,
      setRateLimit,
      data,
      other,
      v2
    });
  }

  dbi.data.clients.forEach((d) => {
    d.client.on("interactionCreate", handle);
  });

  return () => {
    dbi.data.clients.forEach((d) => {
      d.client.off("interactionCreate", handle);
    });
  };
}
