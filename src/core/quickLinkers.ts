import _ from "lodash";
import { addLinks } from "./api";
import { ICollection } from "./defs";

export interface IQuickLinkingArguments {
  linkName: string;
  inversedLinkName?: string;
  /**
   * Defaults to linkName + 'Id' or 'Ids' depending how many we store
   */
  field?: string;
}

export function oneToOne(
  C1: ICollection,
  C2: ICollection,
  options: IQuickLinkingArguments
) {
  addLinks(C1, {
    [options.linkName]: {
      collection: () => C2,
      field: options.field || `${options.linkName}Id`,
      unique: true,
    },
  });

  addLinks(C2, {
    [options.inversedLinkName]: {
      collection: () => C1,
      inversedBy: options.linkName,
    },
  });
}

export function manyToOne(
  C1: ICollection,
  C2: ICollection,
  options: IQuickLinkingArguments
) {
  addLinks(C1, {
    [options.linkName]: {
      collection: () => C2,
      field: options.field || `${options.linkName}Id`,
    },
  });

  addLinks(C2, {
    [options.inversedLinkName]: {
      collection: () => C1,
      inversedBy: options.linkName,
    },
  });
}

export function oneToMany(
  C1: ICollection,
  C2: ICollection,
  options: IQuickLinkingArguments
) {
  addLinks(C1, {
    [options.linkName]: {
      collection: () => C2,
      field: options.field || `${options.linkName}Ids`,
      many: true,
      unique: true,
    },
  });

  addLinks(C2, {
    [options.inversedLinkName]: {
      collection: () => C1,
      inversedBy: options.linkName,
    },
  });
}

export function manyToMany(
  C1: ICollection,
  C2: ICollection,
  options: IQuickLinkingArguments
) {
  addLinks(C1, {
    [options.linkName]: {
      collection: () => C2,
      field: options.field || `${options.linkName}Ids`,
      many: true,
    },
  });

  addLinks(C2, {
    [options.inversedLinkName]: {
      collection: () => C1,
      inversedBy: options.linkName,
    },
  });
}
