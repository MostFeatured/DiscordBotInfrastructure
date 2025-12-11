import { JSDOM } from "jsdom";
import { Eta } from "eta";
import { DBI } from "../../../DBI";
import { NamespaceEnums } from "../../../../generated/namespaceData";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { buildCustomId } from "../../../utils/customId";
import * as stuffs from "stuffs";

const eta = new Eta({
  useWith: true,
});

function getAttributeBoolean(element: Element, attribute: string): boolean {
  return element.hasAttribute(attribute) ? ['true', ''].includes(element.getAttribute(attribute)) : false
}

function parseElementDataAttributes(dbi: DBI<NamespaceEnums>, attributes: NamedNodeMap): any[] {
  let list = Array.from(attributes)
    .filter(attr => attr.nodeName.startsWith("data-"))
    .map(attr => {
      let splited = attr.nodeName.slice(5).split(":");
      let index = parseInt(splited[0]);
      let value;
      switch (splited[1]) {
        case "int":
        case "integer":
        case "float":
        case "number": value = Number(attr.nodeValue!); break;
        case "bool":
        case "boolean": value = attr.nodeValue === "true" || attr.nodeValue === "1"; break;
        case "string":
        case "str": value = attr.nodeValue; break;
        case "refrence":
        case "ref": value = dbi.data.refs.get(attr.nodeValue!)?.value; break;
        case "json": value = JSON.parse(attr.nodeValue!); break;
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

function getCleanTextContent(element: Element): string {
  return (element.textContent?.trim() || "").split("\n").map(line => line.trim()).join("\n");
}

function parseCustomIdAttributes(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element): string {
  let customId = element.getAttribute("custom-id");
  if (!customId) {
    let name = element.getAttribute("name");
    if (!name) throw new Error("Element must have a name or custom-id attribute.");
    customId = buildCustomId(
      dbi,
      dbiName,
      [
        name,
        ...parseElementDataAttributes(dbi, element.attributes),
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
  const style = button.getAttribute("style") || button.getAttribute("button-style") || "Primary";
  const isDisabled = getAttributeBoolean(button, "disabled");

  const needsCustomId = style !== "Link" && style !== "Premium";

  return {
    type: ComponentType.Button,
    style: ButtonStyle[style],
    label: getCleanTextContent(button),
    emoji: button.getAttribute("emoji"),
    custom_id: needsCustomId ? parseCustomIdAttributes(dbi, dbiName, button) : undefined,
    disabled: isDisabled,
    url: button.getAttribute("url"),
    sku_id: button.getAttribute("sku-id"),
  }
}

function parseStringSelect(dbi: DBI<NamespaceEnums>, dbiName: string, stringSelect: Element) {
  let minValues = parseInt(stringSelect.getAttribute("min-values"));
  let maxValues = parseInt(stringSelect.getAttribute("max-values"));

  let options = Array.from(stringSelect.querySelectorAll("option")).map(option => {
    return {
      label: getCleanTextContent(option),
      value: option.getAttribute("value"),
      description: option.getAttribute("description"),
      emoji: option.getAttribute("emoji"),
      default: getAttributeBoolean(option, "default"),
    }
  });

  return {
    type: ComponentType.StringSelect,
    custom_id: parseCustomIdAttributes(dbi, dbiName, stringSelect),
    placeholder: stringSelect.getAttribute("placeholder"),
    min_values: !isNaN(minValues) ? minValues : undefined,
    max_values: !isNaN(maxValues) ? maxValues : undefined,
    disabled: getAttributeBoolean(stringSelect, "disabled"),
    options
  }
}

function parseNonStringSelect(dbi: DBI<NamespaceEnums>, dbiName: string, userSelect: Element, type: ComponentType) {
  let minValues = parseInt(userSelect.getAttribute("min-values"));
  let maxValues = parseInt(userSelect.getAttribute("max-values"));

  let options = Array.from(userSelect.querySelectorAll("option")).map(option => {
    return {
      id: getCleanTextContent(option) || option.getAttribute("id"),
      type: option.getAttribute("type")
    }
  });

  return {
    type,
    custom_id: parseCustomIdAttributes(dbi, dbiName, userSelect),
    placeholder: userSelect.getAttribute("placeholder"),
    min_values: !isNaN(minValues) ? minValues : undefined,
    max_values: !isNaN(maxValues) ? maxValues : undefined,
    disabled: getAttributeBoolean(userSelect, "disabled"),
    options
  }
}

function parseSection(dbi: DBI<NamespaceEnums>, dbiName: string, sectionElement: Element) {
  const childs = [...sectionElement.children];
  const components = childs.find(el => el.tagName === "COMPONENTS");
  const children = Array.from(components?.children || []);

  // Look for accessory in <accessory> wrapper or directly as <thumbnail>/<button>
  let accessory = childs.find(el => el.tagName === "ACCESSORY")?.children?.[0];

  // If no <accessory> wrapper, look for direct thumbnail or button
  if (!accessory) {
    accessory = childs.find(el => el.tagName === "THUMBNAIL" || el.tagName === "BUTTON");
  }

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
    content: getCleanTextContent(textDisplayElement) || "",
  }
}

function parseThumbnail(dbi: DBI<NamespaceEnums>, dbiName: string, thumbnailElement: Element) {
  return {
    type: ComponentType.Thumbnail,
    media: {
      url: thumbnailElement.getAttribute("url") || thumbnailElement.getAttribute("media")
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
        description: getCleanTextContent(mediaGalleryElement) || item.getAttribute("description") || "",
        spoiler: getAttributeBoolean(item, "spoiler"),
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
    spoiler: getAttributeBoolean(fileElement, "spoiler"),
  }
}

function parseSeparator(dbi: DBI<NamespaceEnums>, dbiName: string, separatorElement: Element) {
  return {
    type: ComponentType.Separator,
    divider: separatorElement.hasAttribute("divider"),
    spacing: parseInt(separatorElement.getAttribute("spacing") || '1'),
  }
}

function parseContainer(dbi: DBI<NamespaceEnums>, dbiName: string, containerElement: Element) {
  const components = [...containerElement.children].find(el => el.tagName === "COMPONENTS");
  const children = Array.from(components?.children || []);

  return {
    type: ComponentType.Container,
    components: children.map((element) => {
      return parseElement(dbi, dbiName, element);
    }),
    accent_color: parseColor(containerElement.getAttribute("accent-color") || ""),
    spoiler: containerElement.hasAttribute("spoiler"),
  }
}

function parseTextInput(dbi: DBI<NamespaceEnums>, dbiName: string, textInputSelect: Element) {
  let minLength = parseInt(textInputSelect.getAttribute("min-length"));
  let maxLength = parseInt(textInputSelect.getAttribute("max-length"));

  return {
    type: ComponentType.TextInput,
    custom_id: textInputSelect.getAttribute("custom-id") || textInputSelect.getAttribute("id"),
    style: TextInputStyle[textInputSelect.getAttribute("input-style") || textInputSelect.getAttribute("style") || "Short"],
    label: textInputSelect.getAttribute("label"),
    placeholder: textInputSelect.getAttribute("placeholder"),
    min_length: !isNaN(minLength) ? minLength : undefined,
    max_length: !isNaN(maxLength) ? maxLength : undefined,
    required: textInputSelect.hasAttribute("required"),
    value: getCleanTextContent(textInputSelect) || textInputSelect.getAttribute("value"),
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
    case "TEXT-INPUT":
      return parseTextInput(dbi, dbiName, element);
    default:
      throw new Error(`Unknown HTML component: ${element.tagName}`);
  }
}

export function parseHTMLComponentsV2(dbi: DBI<NamespaceEnums>, template: string, dbiName: string, { data = {}, ttl = 0 }: any = { data: {}, ttl: 0 }) {
  const { window: { document } } = new JSDOM(
    eta.renderString(
      template,
      {
        it: data,
        $refId(obj: any) {
          if (obj?.$ref) return `¤${obj.$ref}`;
          let id = stuffs.randomString(8);
          Object.assign(obj, {
            $ref: id,
            $unRef() { return dbi.data.refs.delete(id); },
          });
          dbi.data.refs.set(id, { at: Date.now(), value: obj, ttl });
          return `¤${id}`;
        }
      }
    )
  );

  const components = [...document.body.children].find(el => el.tagName === "COMPONENTS");
  const children = Array.from(components?.children || []);

  if (!children.length) throw new Error("No components found in the provided HTML template.");

  return children.map((element) => {
    return parseElement(dbi, dbiName, element);
  });
}