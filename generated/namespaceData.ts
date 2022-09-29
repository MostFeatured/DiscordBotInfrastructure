import { DBILangObject } from "../src/types/Locale";

export interface namespaceData {
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
      zort: {
        pırt: (...args: string[]) => string;
      }
    }
  }
}

export type namespaceEnums = keyof namespaceData;

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