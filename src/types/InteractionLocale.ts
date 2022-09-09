import { DBI } from "../DBI";
import { TDBILocaleString } from "./Locale";

export type TDBIInteractionLocaleData = {
  [K in TDBILocaleString]?: {
    name: string;
    description: string;
    options?: {
      [k: string]: {
        name: string;
        description: string;
        choices?: {
          [k: string]: string
        }
      }
    }
  };
};

export type TDBIInteractionLocaleOmitted = Omit<DBIInteractionLocale, "dbi">;

export class DBIInteractionLocale {
  name: string;
  data: TDBIInteractionLocaleData;
  dbi: DBI;
  constructor(dbi, cfg: TDBIInteractionLocaleOmitted) {
    this.dbi = dbi;
    this.name = cfg.name;
    this.data = cfg.data;
  }
}