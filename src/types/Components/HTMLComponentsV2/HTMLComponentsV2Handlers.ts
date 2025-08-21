import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { IDBIButtonExecuteCtx } from "../Button";
import { IDBIChannelSelectMenuExecuteCtx } from "../ChannelSelectMenu";
import { IDBIMentionableSelectMenuExecuteCtx } from "../MentionableSelectMenu";
import { IDBIModalExecuteCtx } from "../Modal";
import { IDBIRoleSelectMenuExecuteCtx } from "../RoleSelectMenu";
import { IDBIStringSelectMenuExecuteCtx } from "../StringSelectMenu";
import { IDBIUserSelectMenuExecuteCtx } from "../UserSelectMenu";

export interface IDBIHanlder<TNamespace extends NamespaceEnums, TExecuteCtx> {
  name: string;
  onExecute?: (ctx: TExecuteCtx) => void;
}

export class DBIHTMLComponentsV2Handlers<TNamespace extends NamespaceEnums> {
  dbi: DBI<TNamespace>;

  constructor(dbi: DBI<TNamespace>) {
    this.dbi = dbi;
  }

  button(cfg: IDBIHanlder<TNamespace, IDBIButtonExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "Button",
    }
  }

  channelSelectMenu(cfg: IDBIHanlder<TNamespace, IDBIChannelSelectMenuExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "ChannelSelectMenu",
    }
  }

  mentionableSelectMenu(cfg: IDBIHanlder<TNamespace, IDBIMentionableSelectMenuExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "MentionableSelectMenu",
    }
  }

  modal(cfg: IDBIHanlder<TNamespace, IDBIModalExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "Modal",
    }
  }

  roleSelectMenu(cfg: IDBIHanlder<TNamespace, IDBIRoleSelectMenuExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "RoleSelectMenu",
    }
  }

  stringSelectMenu(cfg: IDBIHanlder<TNamespace, IDBIStringSelectMenuExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "StringSelectMenu",
    }
  }

  userSelectMenu(cfg: IDBIHanlder<TNamespace, IDBIUserSelectMenuExecuteCtx<TNamespace>>) {
    return {
      name: cfg.name,
      onExecute: cfg.onExecute,
      type: "UserSelectMenu",
    }
  }
}