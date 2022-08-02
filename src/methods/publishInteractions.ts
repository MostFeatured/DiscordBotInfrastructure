import Discord from "discord.js";
import { DBIChatInput } from "../types/ChatInput/ChatInput";
import { REST } from "@discordjs/rest";
import { Routes, RESTGetAPIUserResult, RESTPutAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } from "discord-api-types/v9";
import { reducePermissions } from "../utils/permissions";
import snakecaseKeys from "snakecase-keys";

const PUBLISHABLE_TYPES = ["ChatInput", "UserContextMenu", "MessageContextMenu"];

export async function publishInteractions(
  clientToken: string,
  interactions: Discord.Collection<string, DBIChatInput>,
  publishType: "Guild" | "Global",
  guildId?: string
) {
  interactions = interactions.filter(i => PUBLISHABLE_TYPES.includes(i.type));

  const rest = new REST({ version: "9" });
  rest.setToken(clientToken);

  const me: RESTGetAPIUserResult = await rest.get(Routes.user()) as any;
  
  const body: RESTPutAPIApplicationCommandsJSONBody =
    interactions.reduce((all, current) => {
      switch (current.type) {
        case "ChatInput": {
          let nameSplitted = current.name.split(" ");
          switch (nameSplitted.length) {
            case 1: {
              all.push({
                type: ApplicationCommandType.ChatInput,
                description: current.description,
                name: nameSplitted[0],
                default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
                dm_permission: current.directMessages,
                options: (current.options || []).map(snakecaseKeys)
              });
              break;
            }
            case 2: {
              let baseItem = all.find(i => i.name == current.name.split(" ")[0] && i.type == "ChatInput");
              let option = {
                type: ApplicationCommandOptionType.Subcommand,
                name: nameSplitted[1],
                description: current.description,
                default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
                dm_permission: current.directMessages,
                options: (current.options || []).map(snakecaseKeys)
              };
              if (!baseItem) {
                all.push({
                  type: ApplicationCommandType.ChatInput,
                  name: nameSplitted[0],
                  options: [
                    option
                  ]
                });
              } else {
                baseItem.options.push(option);
              }
              break;
            }
            case 3: {
              let level1Item = all.find(i => i.name == current.name.split(" ")[0] && i.type == "ChatInput");
              if (!level1Item) {
                all.push({
                  type: ApplicationCommandType.ChatInput,
                  name: nameSplitted[0],
                  options: [
                    {
                      type: ApplicationCommandOptionType.SubcommandGroup,
                      name: nameSplitted[1],
                      options: [
                        {
                          type: ApplicationCommandOptionType.Subcommand,
                          name: nameSplitted[2],
                          description: current.description,
                          default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
                          dm_permission: current.directMessages,
                          options: (current.options || []).map(snakecaseKeys)
                        }
                      ]
                    }
                  ]
                });
              } else {
                let level2Item = level1Item.options.find(i => i.name == current.name.split(" ")[1] && i.type == "ChatInput");
                if (!level2Item) {
                  level1Item.options.push({
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: nameSplitted[1],
                    options: [
                      {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: nameSplitted[2],
                        description: current.description,
                        default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
                        dm_permission: current.directMessages,
                        options: (current.options || []).map(snakecaseKeys)
                      }
                    ]
                  })
                } else {
                  level2Item.options.push({
                    type: ApplicationCommandOptionType.Subcommand,
                    name: nameSplitted[2],
                    description: current.description,
                    default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
                    dm_permission: current.directMessages,
                    options: (current.options || []).map(snakecaseKeys)
                  });
                }
              }
              break;
            }
          }
          break;
        }
        case "MessageContextMenu": {
          all.push({
            type: ApplicationCommandType.Message,
            name: current.name,
            default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
            dm_permission: current.directMessages
          });
          break;
        }
        case "UserContextMenu": {
          all.push({
            type: ApplicationCommandType.User,
            name: current.name,
            default_member_permissions: reducePermissions(current.defaultMemberPermissions).toString(),
            dm_permission: current.directMessages
          });
          break;
        }
      }

      return all;
    }, []);
  
  
  switch (publishType) {
    case "Global": {
      await rest.put(Routes.applicationGuildCommands(me.id, guildId), { body });
      break;
    }
    case "Guild": {
      await rest.put(Routes.applicationCommands(me.id), { body });
      break;
    }
  }
  
}