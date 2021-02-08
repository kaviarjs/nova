import {
  IExpanderOptions,
  ILinkOptions,
  QueryBodyType,
  IReducerOption,
  IReducerOptions,
  ICollection,
  IAstToQueryOptions,
  IQueryContext,
} from "./defs";

import {
  EXPANDER_STORAGE,
  LINK_STORAGE,
  REDUCER_STORAGE,
  LINK_COLLECTION_OPTIONS_DEFAULTS,
} from "./constants";
import * as _ from "lodash";
import Linker from "./query/Linker";
import Query from "./query/Query";
import astToQuery from "./graphql/astToQuery";
import { IGetLookupOperatorOptions } from "./query/Linker";

export function query<T>(
  collection: ICollection,
  body: QueryBodyType,
  context?: IQueryContext
) {
  return new Query(collection, body, context);
}

query.graphql = (
  collection: ICollection,
  ast: any,
  options: IAstToQueryOptions
) => {
  return astToQuery(collection, ast, options);
};

export function clear(collection: ICollection) {
  collection[LINK_STORAGE] = {};
  collection[REDUCER_STORAGE] = {};
  collection[EXPANDER_STORAGE] = {};
}

export function addLinks(collection: ICollection, data: ILinkOptions) {
  if (!collection[LINK_STORAGE]) {
    collection[LINK_STORAGE] = {};
  }

  _.forEach(data, (linkConfig, linkName) => {
    if (collection[LINK_STORAGE][linkName]) {
      throw new Error(
        `You cannot add the link with name: ${linkName} because it was already added to ${this.collectionName} collection`
      );
    }

    const linker = new Linker(collection, linkName, {
      ...LINK_COLLECTION_OPTIONS_DEFAULTS,
      ...linkConfig,
    });

    Object.assign(collection[LINK_STORAGE], {
      [linkName]: linker,
    });
  });
}

export function addExpanders(collection: ICollection, data: IExpanderOptions) {
  if (!collection[EXPANDER_STORAGE]) {
    collection[EXPANDER_STORAGE] = {};
  }

  _.forEach(data, (expanderConfig, expanderName) => {
    if (collection[EXPANDER_STORAGE][expanderName]) {
      throw new Error(`This expander was already added.`);
    }

    Object.assign(collection[EXPANDER_STORAGE], {
      [expanderName]: expanderConfig,
    });
  });
}

export function getLinker(collection: ICollection, name: string): Linker {
  if (collection[LINK_STORAGE] && collection[LINK_STORAGE][name]) {
    return collection[LINK_STORAGE][name];
  } else {
    throw new Error(
      `Link "${name}" is not found in collection: "${collection.collectionName}"`
    );
  }
}

export function hasLinker(collection: ICollection, name: string): boolean {
  if (collection[LINK_STORAGE]) {
    return Boolean(collection[LINK_STORAGE][name]);
  } else {
    return false;
  }
}

/**
 * This returns the correct aggregation pipeline operator
 * This is useful for complex searching and filtering
 */
export function lookup(
  collection: ICollection,
  linkName: string,
  options?: IGetLookupOperatorOptions
) {
  return getLinker(collection, linkName).getLookupAggregationPipeline(options);
}

export function getReducerConfig(
  collection: ICollection,
  name: string
): IReducerOption {
  if (collection[REDUCER_STORAGE]) {
    return collection[REDUCER_STORAGE][name];
  }
}

export function getExpanderConfig(
  collection: ICollection,
  name: string
): QueryBodyType {
  if (collection[EXPANDER_STORAGE]) {
    return collection[EXPANDER_STORAGE][name];
  }
}

export function addReducers(collection: ICollection, data: IReducerOptions) {
  if (!collection[REDUCER_STORAGE]) {
    collection[REDUCER_STORAGE] = {};
  }

  Object.keys(data).forEach((reducerName) => {
    const reducerConfig = data[reducerName];

    if (hasLinker(collection, reducerName)) {
      throw new Error(
        `You cannot add the reducer with name: ${reducerName} because it is already defined as a link in ${collection.collectionName} collection`
      );
    }

    if (collection[REDUCER_STORAGE][reducerName]) {
      throw new Error(
        `You cannot add the reducer with name: ${reducerName} because it was already added to ${collection.collectionName} collection`
      );
    }

    Object.assign(collection[REDUCER_STORAGE], {
      [reducerName]: reducerConfig,
    });
  });
}
