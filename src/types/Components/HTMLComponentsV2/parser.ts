import { JSDOM } from "jsdom";
import { Eta } from "eta";
import { DBI } from "../../../DBI";
import { NamespaceEnums } from "../../../../generated/namespaceData";
import { ButtonStyle, ComponentType } from "discord.js";
import { buildCustomId } from "../../../utils/customId";

const eta = new Eta();

function parseElementDataAttributes(attributes: NamedNodeMap): string[] {
  let list = Array.from(attributes)
    .filter(attr => attr.nodeName.startsWith("data-"))
    .map(attr => {
      return {
        index: parseInt(attr.nodeName.slice(5)),
        value: attr.nodeValue
      };
    })
    .sort((a, b) => a.index - b.index)
    .map(i => i.value);
  let data = attributes.getNamedItem("data")?.nodeValue;
  return list.length ? list : data ? [data] : [];
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
  let customId = button.getAttribute("custom-id");
  if (!customId) {
    let name = button.getAttribute("name");
    if (!name) throw new Error("Button must have a name or custom-id attribute.");
    customId = buildCustomId(
      dbi,
      dbiName,
      [
        name,
        ...parseElementDataAttributes(button.attributes),
      ],
      button.hasAttribute("ttl") ? parseInt(button.getAttribute("ttl")!) : undefined,
      true
    );
  }
  return {
    type: ComponentType.Button,
    style: ButtonStyle[button.getAttribute("style") || "Primary"],
    label: button.textContent?.trim(),
    emoji: button.getAttribute("emoji"),
    custom_id: customId,
    disabled: button.hasAttribute("disabled"),
    url: button.getAttribute("url"),
    sku_id: button.getAttribute("sku-id"),
  }
}

function parseElement(dbi: DBI<NamespaceEnums>, dbiName: string, element: Element) {
  switch (element.tagName) {
    case "ACTION-ROW":
      return parseActionRow(dbi, dbiName, element);
    case "BUTTON":
      return parseButton(dbi, dbiName, element);
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