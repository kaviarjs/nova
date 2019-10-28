import {
  ExpanderOptions,
  EXPANDER_STORAGE,
  FieldMapOptions,
  LINK_STORAGE,
  LinkCollectionOptionsDefaults,
  LinkOptions,
  QueryBody,
  REDUCER_STORAGE,
  ReducerOption,
  ReducerOptions,
} from "./constants";
import * as _ from "lodash";
import * as mongodb from "mongodb";
import Linker from "./query/Linker";
import Query from "./query/query";
import astToQuery, { AstToQueryOptions } from "./graphql/astToQuery";

export function enhance(prototype, resolve = ctx => this) {
  Object.assign(prototype, {
    query(body: QueryBody) {
      return query(resolve(this), body);
    },
    addLinks(options: LinkOptions) {
      return addLinks(resolve(this), options);
    },
    addReducers(options: ReducerOptions) {
      return addReducers(resolve(this), options);
    },
    addExpanders(options: ExpanderOptions) {
      return addExpanders(resolve(this), options);
    },
  });

  prototype.query.graphql = (ast: any, options: AstToQueryOptions) => {
    return query.graphql(resolve(this), ast, options);
  };
}

export function query(collection: mongodb.Collection, body: QueryBody) {
  return new Query(collection, body);
}

query.graphql = (
  collection: mongodb.Collection,
  ast: any,
  options: AstToQueryOptions
) => {
  return astToQuery(collection, ast, options);
};

export function clear(collection: mongodb.Collection) {
  collection[LINK_STORAGE] = {};
  collection[REDUCER_STORAGE] = {};
  collection[EXPANDER_STORAGE] = {};
}

export function addLinks(collection: mongodb.Collection, data: LinkOptions) {
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
      ...LinkCollectionOptionsDefaults,
      ...linkConfig,
    });

    Object.assign(collection[LINK_STORAGE], {
      [linkName]: linker,
    });
  });
}

export function addExpanders(
  collection: mongodb.Collection,
  data: ExpanderOptions
) {
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

export function getLinker(
  collection: mongodb.Collection,
  name: string
): Linker {
  if (collection[LINK_STORAGE]) {
    return collection[LINK_STORAGE][name];
  }
}

export function getReducerConfig(
  collection: mongodb.Collection,
  name: string
): ReducerOption {
  if (collection[REDUCER_STORAGE]) {
    return collection[REDUCER_STORAGE][name];
  }
}

export function getExpanderConfig(
  collection: mongodb.Collection,
  name: string
): QueryBody {
  if (collection[EXPANDER_STORAGE]) {
    return collection[EXPANDER_STORAGE][name];
  }
}

export function addReducers(
  collection: mongodb.Collection,
  data: ReducerOptions
) {
  if (!collection[REDUCER_STORAGE]) {
    collection[REDUCER_STORAGE] = {};
  }

  Object.keys(data).forEach(reducerName => {
    const reducerConfig = data[reducerName];

    if (getLinker(collection, reducerName)) {
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
