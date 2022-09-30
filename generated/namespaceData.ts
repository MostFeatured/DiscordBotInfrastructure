import { DBILangObject } from "../src/types/Locale";

export interface NamespaceData {
  // [key: string]: {
  //   contentLocale: DBILangObject
  // }
  test: {
    contentLocale: {
      zort: {
        pırt: (...args: string[]) => string;
      }
    }
  };
  bum: {
    contentLocale: {
        sort: (...args: string[]) => string;
    }
  }
}

export type NamespaceEnums = keyof NamespaceData;

/**
export interface namespaceData {
  test: {
    contentLocale: {
      zort: {
        pırt: (...args: string[]) => string;
      }
    }
  };
}

export type namespaceEnums = keyof namespaceData;
 */