import { JSDOM } from "jsdom";
import { Eta } from "eta";
import { DBI } from "../../../DBI";
import { NamespaceEnums } from "../../../../generated/namespaceData";
import { ButtonStyle, ComponentType } from "discord.js";
import { buildCustomId } from "../../../utils/customId";

const eta = new Eta();

function parseElementDataAttributes(attributes: NamedNodeMap): any[] {
  let list = Array.from(attributes)
    .filter(attr => attr.nodeName.startsWith("data-"))
    .map(attr => {
      let splited = attr.nodeName.split("-");
      let index = parseInt(splited[1]);
      let value;
      switch (splited[2]) {
        case "number": value = Number(attr.nodeValue!); break;
        case "boolean": value = attr.nodeValue === "true"; break;
        case "json": value = JSON.parse(attr.nodeValue!); break;
        case "string":
        default: value = attr.nodeValue; break;
      }
      return {
        index,
        value
      };
    })
    .sort((a, b) => a.index - b.index)
    .map(i => i.value);
  let data = attributes.getNamedItem("data")?.nodeValue;
  return list.length ? list : data ? [data] : [];
}

function parseCustomIdAttributes(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element): string {
  let customId = element.getAttribute("custom-id");
  if (!customId) {
    let name = element.getAttribute("name");
    if (!name) throw new Error("String Select Menu must have a name or custom-id attribute.");
    customId = buildCustomId(
      dbi,
      dbiName,
      [
        name,
        ...parseElementDataAttributes(element.attributes),
      ],
      element.hasAttribute("ttl") ? parseInt(element.getAttribute("ttl")!) : undefined,
      true
    );
  }
  return customId;
}

function parseActionRow(dbi: DBI<NamespaceEnums>, dbiName: string, actionRow: Element) {
  return {
    type: ComponentType.ActionRow,
    components: Array.from(actionRow.children).map((element) => {
      return parseElement(dbi, dbiName, element);
    })
  }
}

function parseButton(dbi: DBI<NamespaceEnums>, dbiName: string, button: Element) {
  return {
    type: ComponentType.Button,
    style: ButtonStyle[button.getAttribute("button-style") || button.getAttribute("style") || "Primary"],
    label: button.textContent?.trim(),
    emoji: button.getAttribute("emoji"),
    custom_id: parseCustomIdAttributes(dbi, dbiName, button),
    disabled: button.hasAttribute("disabled"),
    url: button.getAttribute("url"),
    sku_id: button.getAttribute("sku-id"),
  }
}

function parseStringSelect(dbi: DBI<NamespaceEnums>, dbiName: string, stringSelect: Element) {
  let minValues = parseInt(stringSelect.getAttribute("min-values"));
  let maxValues = parseInt(stringSelect.getAttribute("max-values"));

  let options = Array.from(stringSelect.querySelectorAll("option")).map(option => {
    return {
      label: option.textContent?.trim(),
      value: option.getAttribute("value"),
      description: option.getAttribute("description"),
      emoji: option.getAttribute("emoji"),
      default: option.hasAttribute("default")
    }
  });

  return {
    type: ComponentType.StringSelect,
    custom_id: parseCustomIdAttributes(dbi, dbiName, stringSelect),
    placeholder: stringSelect.getAttribute("placeholder"),
    min_values: !isNaN(minValues) ? minValues : undefined,
    max_values: !isNaN(maxValues) ? maxValues : undefined,
    disabled: stringSelect.hasAttribute("disabled"),
    options
  }
}

function parseNonStringSelect(dbi: DBI<NamespaceEnums>, dbiName: string, userSelect: Element, type: ComponentType) {
  let minValues = parseInt(userSelect.getAttribute("min-values"));
  let maxValues = parseInt(userSelect.getAttribute("max-values"));

  let options = Array.from(userSelect.querySelectorAll("option")).map(option => {
    return {
      id: option.textContent?.trim() || option.getAttribute("id"),
      type: option.getAttribute("type")
    }
  });

  return {
    type,
    custom_id: parseCustomIdAttributes(dbi, dbiName, userSelect),
    placeholder: userSelect.getAttribute("placeholder"),
    min_values: !isNaN(minValues) ? minValues : undefined,
    max_values: !isNaN(maxValues) ? maxValues : undefined,
    disabled: userSelect.hasAttribute("disabled"),
    options
  }
}

function parseSection(dbi: DBI<NamespaceEnums>, dbiName: string, sectionElement: Element) {
  const components = sectionElement.querySelector("& > components");
  const children = Array.from(components?.children || []);

  const accessory = sectionElement.querySelector("accessory");

  return {
    type: ComponentType.Section,
    components: children.map((element) => {
      return parseElement(dbi, dbiName, element);
    }),
    ...(accessory ? { accessory: parseElement(dbi, dbiName, accessory) } : {})
  }
}

function parseTextDisplay(dbi: DBI<NamespaceEnums>, dbiName: string, textDisplayElement: Element) {
  return {
    type: ComponentType.TextDisplay,
    component: textDisplayElement.textContent?.trim() || "",
  }
}

function parseThumbnail(dbi: DBI<NamespaceEnums>, dbiName: string, thumbnailElement: Element) {
  return {
    type: ComponentType.Thumbnail,
    media: {
      url: thumbnailElement.getAttribute("url")
    }
  }
}

function parseMediaGallery(dbi: DBI<NamespaceEnums>, dbiName: string, mediaGalleryElement: Element) {
  return {
    type: ComponentType.MediaGallery,
    items: Array.from(mediaGalleryElement.querySelectorAll("item")).map(item => {
      return {
        media: {
          url: item.getAttribute("url")
        },
        description: item.textContent?.trim() || item.getAttribute("description") || "",
        spoiler: item.hasAttribute("spoiler"),
      };
    })
  }
}

function parseFile(dbi: DBI<NamespaceEnums>, dbiName: string, fileElement: Element) {
  return {
    type: ComponentType.File,
    file: {
      url: fileElement.getAttribute("url"),
    },
    spoiler: fileElement.hasAttribute("spoiler"),
  }
}

function parseSeparator(dbi: DBI<NamespaceEnums>, dbiName: string, separatorElement: Element) {
  return {
    type: ComponentType.File,
    divider: separatorElement.hasAttribute("divider"),
    spacing: parseInt(separatorElement.getAttribute("spacing") || '0'),
  }
}

function parseContainer(dbi: DBI<NamespaceEnums>, dbiName: string, containerElement: Element) {
  const components = containerElement.querySelector("& > components");
  const children = Array.from(components?.children || []);

  return {
    type: ComponentType.Section,
    components: children.map((element) => {
      return parseElement(dbi, dbiName, element);
    }),
    accent_color: parseColor(containerElement.getAttribute("accent-color") || ""),
    spoiler: containerElement.hasAttribute("spoiler"),
  }
}

function parseColor(color: string) {
  if (!color) return;
  if (/\d{3,6}/.test(color)) return parseInt(color, 10);
  if (color.startsWith("#")) return parseInt(color.slice(1), 16);
  if (color.startsWith("0x")) return parseInt(color.slice(2), 16);
  if (color.startsWith("rgb(")) {
    const rgb = color.slice(4, -1).split(",").map(Number);
    return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
  }
  return parseInt(color, 16);
}

function parseElement(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element) {
  switch (element.tagName) {
    case "ACTION-ROW":
      return parseActionRow(dbi, dbiName, element);
    case "BUTTON":
      return parseButton(dbi, dbiName, element);
    case "STRING-SELECT":
      return parseStringSelect(dbi, dbiName, element);
    case "USER-SELECT":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.UserSelect);
    case "ROLE-SELECT":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.RoleSelect);
    case "MENTIONABLE-SELECT":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.MentionableSelect);
    case "CHANNEL-SELECT":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.ChannelSelect);
    case "SECTION":
      return parseSection(dbi, dbiName, element);
    case "TEXT-DISPLAY":
      return parseTextDisplay(dbi, dbiName, element);
    case "THUMBNAIL":
      return parseThumbnail(dbi, dbiName, element);
    case "MEDIA-GALLERY":
      return parseMediaGallery(dbi, dbiName, element);
    case "FILE":
      return parseFile(dbi, dbiName, element);
    case "SEPARATOR":
      return parseSeparator(dbi, dbiName, element);
    case "CONTAINER":
      return parseContainer(dbi, dbiName, element);
    default:
      throw new Error(`Unknown HTML component: ${element.tagName}`);
  }
}

export function parseHTMLComponentsV2(dbi: DBI<NamespaceEnums>, template: string, dbiName: string, { data }: any = {}) {
  const { window: { document } } = new JSDOM(eta.renderString(template, data));

  const components = document.body.querySelector("& > components");
  const children = Array.from(components?.children || []);

  if (!children.length) throw new Error("No components found in the provided HTML template.");

  return children.map((element) => {
    return parseElement(dbi, dbiName, element);
  });
}