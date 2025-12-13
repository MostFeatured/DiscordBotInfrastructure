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

  // Support both <option> and <select-option> elements (Svelte may output either)
  let options = Array.from(stringSelect.querySelectorAll("option, select-option")).map(option => {
    return {
      label: option.getAttribute("label") || getCleanTextContent(option),
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

  // Support both <option> and <select-option> elements (Svelte may output either)
  let options = Array.from(userSelect.querySelectorAll("option, select-option")).map(option => {
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

/**
 * Parse a modal element into Discord Modal format
 * Now supports the new Label component structure with various child components:
 * - text-input (type 4)
 * - string-select (type 3)
 * - user-select (type 5)
 * - role-select (type 6)
 * - mentionable-select (type 7)
 * - channel-select (type 8)
 * - file-upload (type 19)
 * - text-display (type 10)
 * 
 * Example with Label wrapper (recommended):
 * <components type="modal" id="my-modal" title="My Modal">
 *   <label label="Your Name" description="Enter your full name">
 *     <text-input id="name" style="Short" />
 *   </label>
 *   <label label="Select Bug Type">
 *     <string-select id="bug-type">
 *       <option value="ant">🐜 Ant</option>
 *     </string-select>
 *   </label>
 * </components>
 * 
 * Legacy format (still supported but deprecated):
 * <components type="modal" id="my-modal" title="My Modal">
 *   <text-input id="name" label="Name" />
 * </components>
 */
export function parseModal(dbi: DBI<NamespaceEnums>, dbiName: string, modalElement: Element, { data = {}, ttl = 0 }: any = {}) {
  const title = modalElement.getAttribute("title") || "Modal";
  const modalId = modalElement.getAttribute("id") || modalElement.getAttribute("name");

  if (!modalId) {
    throw new Error("Modal must have an id or name attribute");
  }

  // Parse modal children - supports Label, action-row (legacy), and direct text-input (legacy)
  const children = Array.from(modalElement.children);
  const components: any[] = [];

  for (const element of children) {
    const tagName = element.tagName.toUpperCase();

    if (tagName === "FIELD") {
      // New Label component (type 18) - wraps other modal components
      components.push(parseModalField(dbi, dbiName, element));
    } else if (tagName === "ACTION-ROW") {
      // Legacy: Action row with text inputs (deprecated but still supported)
      components.push({
        type: ComponentType.ActionRow,
        components: Array.from(element.children).map((child) => {
          return parseModalComponent(dbi, dbiName, child);
        })
      });
    } else if (tagName === "TEXT-INPUT") {
      // Legacy: Direct text-input auto-wrapped in action row
      components.push({
        type: ComponentType.ActionRow,
        components: [parseTextInput(dbi, dbiName, element)]
      });
    } else if (tagName === "TEXT-DISPLAY") {
      // Text display directly in modal (type 10)
      components.push({
        type: 10, // ComponentType.TextDisplay
        content: getCleanTextContent(element)
      });
    } else {
      // Try to parse as a modal-supported component and auto-wrap in Label
      const supportedTags = ['STRING-SELECT', 'USER-SELECT', 'ROLE-SELECT', 'MENTIONABLE-SELECT', 'CHANNEL-SELECT', 'FILE-UPLOAD'];
      if (supportedTags.includes(tagName)) {
        // Auto-wrap in a label for convenience
        components.push({
          type: 18, // Label
          label: element.getAttribute("label") || element.getAttribute("placeholder") || tagName.toLowerCase(),
          description: element.getAttribute("description"),
          component: parseModalComponent(dbi, dbiName, element)
        });
      } else {
        console.warn(`[DBI-Modal] Unsupported element in modal: ${tagName}. Supported: field, text-input, text-display, string-select, user-select, role-select, mentionable-select, channel-select, file-upload`);
      }
    }
  }

  // Build custom_id for the modal - include ref for state persistence
  const customIdParts: any[] = [modalId];

  // Add ref if data has one (for state persistence across modal submit)
  // Use ¤ prefix so it gets resolved to actual state object when interaction is received
  if (data?.$ref) {
    customIdParts.push(`¤${data.$ref}`);
  }

  const customId = buildCustomId(dbi, dbiName, customIdParts, ttl, true);

  return {
    title,
    customId,
    components,
    modalId, // Store original ID for handler lookup
  };
}

/**
 * Parse a Field/Label component for modals (type 18)
 * <field label="Field Name" description="Optional description">
 *   <text-input id="field" />
 * </field>
 */
function parseModalField(dbi: DBI<NamespaceEnums>, dbiName: string, fieldElement: Element) {
  const label = fieldElement.getAttribute("label") || "Label";
  const description = fieldElement.getAttribute("description");

  // Get the child component
  const child = fieldElement.children[0];
  if (!child) {
    throw new Error("Field component must have a child component (text-input, string-select, etc.);");
  }

  return {
    type: 18, // Label component type
    label,
    description,
    component: parseModalComponent(dbi, dbiName, child)
  };
}

/**
 * Parse a component that can be inside a modal Label
 */
function parseModalComponent(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element): any {
  const tagName = element.tagName.toUpperCase();

  switch (tagName) {
    case "TEXT-INPUT":
      return parseTextInput(dbi, dbiName, element);

    case "STRING-SELECT":
    case "STRING-SELECT-MENU":
      return parseStringSelectForModal(dbi, dbiName, element);

    case "USER-SELECT":
    case "USER-SELECT-MENU":
      return parseAutoSelectForModal(dbi, dbiName, element, 5); // type 5

    case "ROLE-SELECT":
    case "ROLE-SELECT-MENU":
      return parseAutoSelectForModal(dbi, dbiName, element, 6); // type 6

    case "MENTIONABLE-SELECT":
    case "MENTIONABLE-SELECT-MENU":
      return parseAutoSelectForModal(dbi, dbiName, element, 7); // type 7

    case "CHANNEL-SELECT":
    case "CHANNEL-SELECT-MENU":
      return parseAutoSelectForModal(dbi, dbiName, element, 8); // type 8

    case "FILE-UPLOAD":
      return parseFileUpload(dbi, dbiName, element);

    default:
      throw new Error(`Unsupported modal component: ${tagName}. Supported: text-input, string-select, user-select, role-select, mentionable-select, channel-select, file-upload`);
  }
}

/**
 * Parse a string select for modal (similar to message but with required field)
 */
function parseStringSelectForModal(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element) {
  const customId = element.getAttribute("id") || element.getAttribute("custom-id") || element.getAttribute("name");
  if (!customId) {
    throw new Error("String select in modal must have an id, custom-id, or name attribute");
  }

  const minValues = parseInt(element.getAttribute("min-values") || "1");
  const maxValues = parseInt(element.getAttribute("max-values") || "1");
  const required = element.getAttribute("required") !== "false";

  const options = Array.from(element.querySelectorAll("option")).map((option) => ({
    label: getCleanTextContent(option) || option.getAttribute("label") || "Option",
    value: option.getAttribute("value") || getCleanTextContent(option),
    description: option.getAttribute("description"),
    emoji: option.getAttribute("emoji") ? { name: option.getAttribute("emoji") } : undefined,
    default: getAttributeBoolean(option, "default")
  }));

  return {
    type: 3, // String Select
    custom_id: customId,
    placeholder: element.getAttribute("placeholder"),
    min_values: isNaN(minValues) ? 1 : minValues,
    max_values: isNaN(maxValues) ? 1 : maxValues,
    required,
    options
  };
}

/**
 * Parse auto-populated select menus for modal (user, role, mentionable, channel)
 */
function parseAutoSelectForModal(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element, componentType: number) {
  const customId = element.getAttribute("id") || element.getAttribute("custom-id") || element.getAttribute("name");
  if (!customId) {
    throw new Error(`Select menu in modal must have an id, custom-id, or name attribute`);
  }

  const minValues = parseInt(element.getAttribute("min-values") || "1");
  const maxValues = parseInt(element.getAttribute("max-values") || "1");
  const required = element.getAttribute("required") !== "false";

  const result: any = {
    type: componentType,
    custom_id: customId,
    placeholder: element.getAttribute("placeholder"),
    min_values: isNaN(minValues) ? 1 : minValues,
    max_values: isNaN(maxValues) ? 1 : maxValues,
    required
  };

  // Channel select can have channel_types filter
  if (componentType === 8) {
    const channelTypes = element.getAttribute("channel-types");
    if (channelTypes) {
      result.channel_types = channelTypes.split(",").map(t => parseInt(t.trim()));
    }
  }

  return result;
}

/**
 * Parse file upload component for modals (type 19)
 * <file-upload id="attachment" min-values="1" max-values="5" />
 */
function parseFileUpload(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element) {
  const customId = element.getAttribute("id") || element.getAttribute("custom-id") || element.getAttribute("name");
  if (!customId) {
    throw new Error("File upload must have an id, custom-id, or name attribute");
  }

  const minValues = parseInt(element.getAttribute("min-values") || "1");
  const maxValues = parseInt(element.getAttribute("max-values") || "1");
  const required = element.getAttribute("required") !== "false";

  return {
    type: 19, // File Upload
    custom_id: customId,
    min_values: isNaN(minValues) ? 1 : minValues,
    max_values: isNaN(maxValues) ? 1 : maxValues,
    required
  };
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
    case "STRING-SELECT-MENU":
      return parseStringSelect(dbi, dbiName, element);
    case "USER-SELECT":
    case "USER-SELECT-MENU":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.UserSelect);
    case "ROLE-SELECT":
    case "ROLE-SELECT-MENU":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.RoleSelect);
    case "MENTIONABLE-SELECT":
    case "MENTIONABLE-SELECT-MENU":
      return parseNonStringSelect(dbi, dbiName, element, ComponentType.MentionableSelect);
    case "CHANNEL-SELECT":
    case "CHANNEL-SELECT-MENU":
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

export interface ParsedComponentsResult {
  /** Main components to display (id="main" or no id/type) */
  components: any[];
  /** Modal definitions keyed by their id */
  modals: Map<string, { title: string; customId: string; components: any[]; modalId: string }>;
}

/**
 * Parse HTML with support for multiple <components> elements
 * - <components> or <components id="main"> - Main display components
 * - <components type="modal" id="xxx"> - Modal definitions
 */
export function parseHTMLComponentsV2Multi(dbi: DBI<NamespaceEnums>, template: string, dbiName: string, { data = {}, ttl = 0 }: any = { data: {}, ttl: 0 }): ParsedComponentsResult {
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

  // Only select top-level <components> elements (direct children of body)
  // This avoids selecting nested <components> inside <container>, <section>, etc.
  const allComponents = [...document.body.children].filter(el => el.tagName === "COMPONENTS");
  const modals = new Map<string, { title: string; customId: string; components: any[]; modalId: string }>();
  let mainComponents: any[] = [];

  for (const componentsEl of allComponents) {
    const type = componentsEl.getAttribute("type");
    const id = componentsEl.getAttribute("id");

    if (type === "modal") {
      // This is a modal definition
      const modalData = parseModal(dbi, dbiName, componentsEl, { data, ttl });
      modals.set(modalData.modalId, modalData);
    } else if (!id || id === "main") {
      // This is the main components (no id, or id="main")
      const children = Array.from(componentsEl.children);
      mainComponents = children.map((element) => parseElement(dbi, dbiName, element));
    }
    // Components with other ids are ignored (could be used for other purposes)
  }

  if (!mainComponents.length && modals.size === 0) {
    throw new Error("No components found in the provided HTML template.");
  }

  return {
    components: mainComponents,
    modals
  };
}