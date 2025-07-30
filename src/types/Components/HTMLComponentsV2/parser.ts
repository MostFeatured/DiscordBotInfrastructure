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
    style: ButtonStyle[button.getAttribute("style") || "Primary"],
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

function parseElement(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element) {
  switch (element.tagName) {
    case "ACTION-ROW":
      return parseActionRow(dbi, dbiName, element);
    case "BUTTON":
      return parseButton(dbi, dbiName, element);
    case "STRING-SELECT":
      return parseStringSelect(dbi, dbiName, element);
    default:
      throw new Error(`Unknown HTML component: ${element.tagName}`);
  }
}

export function parseHTMLComponentsV2(dbi: DBI<NamespaceEnums>, template: string, dbiName: string, { data }: any = {}) {
  const { window: { document } } = new JSDOM(eta.renderString(template, data));

  const components = document.querySelector("components");
  return Array.from(components?.children || []).map((element) => {
    return parseElement(dbi, dbiName, element);
  });
}