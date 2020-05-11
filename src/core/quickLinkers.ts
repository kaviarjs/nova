import _ from "lodash";
import { addLinks } from "./api";
import { IAggregable } from "./defs";

export type QuickLinkingArguments = {
  linkName: string;
  inversedLinkName?: string;
  /**
   * Defaults to linkName + 'Id' or 'Ids' depending how many we store
   */
  field?: string;
};

export function oneToOne(
  C1: IAggregable,
  C2: IAggregable,
  options: QuickLinkingArguments
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
  C1: IAggregable,
  C2: IAggregable,
  options: QuickLinkingArguments
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
  C1: IAggregable,
  C2: IAggregable,
  options: QuickLinkingArguments
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
  C1: IAggregable,
  C2: IAggregable,
  options: QuickLinkingArguments
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
