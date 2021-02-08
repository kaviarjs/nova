// import intersectDeep from "../../core/query/lib/intersectDeep";
import * as _ from "lodash";
import * as graphqlFields from "graphql-fields";
import { SPECIAL_PARAM_FIELD } from "../constants";
import Query from "../query/Query";
import intersectDeep from "./intersectDeep";
import {
  ICollection,
  QueryBodyType,
  IAstToQueryOptions,
  IQueryContext,
} from "../defs";
import { mergeDeep } from "./mergeDeep";

export const ArgumentStore = Symbol("GraphQLArgumentStore");

const Errors = {
  MAX_DEPTH: "The maximum depth of this request exceeds the depth allowed.",
};

export function astToBody(ast): QueryBodyType {
  const body = graphqlFields(
    ast,
    {},
    { processArguments: true, excludedFields: ["__typename"] }
  );

  replaceArgumentsWithOurs(body);

  return body;
}

function replaceArgumentsWithOurs(body: any) {
  _.forEach(body, (value, key) => {
    if (key === "__arguments") {
      let args = {};
      (value as any[]).forEach((argument) => {
        _.forEach(argument, (value, key) => {
          args[key] = value.value;
        });
      });

      body[ArgumentStore] = args;
      delete body[key];

      return;
    }

    if (_.isObject(value)) {
      replaceArgumentsWithOurs(value);
    }
  });
}

export default function astToQuery(
  collection: ICollection,
  ast,
  config: IAstToQueryOptions = {},
  context?: IQueryContext
) {
  // get the body
  let body = astToBody(ast);
  if (!body.$) {
    body.$ = {};
  }

  if (typeof body.$ !== "function") {
    if (config.filters) {
      body.$.filters = config.filters;
    }

    if (config.options) {
      body.$.options = config.options;
    }
  } else {
    throw new Error(
      `You tried to apply filters and options on a functionable parameterable object.`
    );
  }

  if (config.sideBody) {
    mergeDeep(body, config.sideBody);
  }

  // figure out depth based
  if (config.maxDepth) {
    const currentMaxDepth = getMaxDepth(body);
    if (currentMaxDepth > config.maxDepth) {
      throw new Error(Errors.MAX_DEPTH);
    }
  }

  if (config.deny) {
    deny(body, config.deny);
  }

  if (config.intersect) {
    body = intersectDeep(body, config.intersect);
  }

  if (config.embody) {
    const getArguments = createGetArguments(body);
    config.embody.call(null, body, getArguments);
  }

  // enforce the maximum amount of data we allow to retrieve
  if (config.maxLimit) {
    enforceMaxLimit(body[SPECIAL_PARAM_FIELD], config.maxLimit);
  }

  // we return the query
  return new Query(collection, body, context);
}

export function getMaxDepth(body) {
  const depths = [];
  for (const key in body) {
    if (key !== SPECIAL_PARAM_FIELD && _.isObject(body[key])) {
      depths.push(getMaxDepth(body[key]));
    }
  }

  if (depths.length === 0) {
    return 1;
  }

  return Math.max(...depths) + 1;
}

/**
 * This function performs modifications and alterations on the body
 * By removing the fields that are denied.
 *
 * @param body
 * @param fields
 */
export function deny(body, fields) {
  fields.forEach((field) => {
    let parts = field.split(".");
    let accessor = body;
    while (parts.length !== 0) {
      if (parts.length === 1) {
        delete accessor[parts[0]];
      } else {
        if (!_.isObject(accessor)) {
          break;
        }
        accessor = accessor[parts[0]];
      }
      parts.shift();
    }
  });

  return clearEmptyObjects(body);
}

export function clearEmptyObjects(body) {
  // clear empty nodes then back-propagate
  for (let key in body) {
    if (_.isObject(body[key])) {
      const shouldDelete = clearEmptyObjects(body[key]);
      if (shouldDelete) {
        delete body[key];
      }
    }
  }

  return Object.keys(body).length === 0;
}

/**
 * Ensures that there is a limit for the data you want to receive
 * @param props
 * @param maxLimit
 */
export function enforceMaxLimit(props: any, maxLimit: number) {
  if (!props.options) {
    props.options = {};
  }

  const options = props.options;

  if (maxLimit === undefined) {
    return;
  }

  if (options.limit) {
    if (options.limit > maxLimit) {
      options.limit = maxLimit;
    }
  } else {
    options.limit = maxLimit;
  }
}

// The converter function
export function astQueryToInfo(astToInfo) {
  const operation = astToInfo.definitions.find(
    ({ kind }) => kind === "OperationDefinition"
  );
  const fragments = astToInfo.definitions
    .filter(({ kind }) => kind === "FragmentDefinition")
    .reduce(
      (result, current) => ({
        ...result,
        [current.name.value]: current,
      }),
      {}
    );

  return {
    fieldNodes: operation.selectionSet.selections,
    fragments,
  };
}

export function createGetArguments(body) {
  return function (path) {
    const parts = path.split(".");
    let stopped = false;
    let accessor = body;
    for (var i = 0; i < parts.length; i++) {
      if (!accessor) {
        stopped = true;
        break;
      }

      if (accessor[parts[i]]) {
        accessor = accessor[parts[i]];
      }
    }

    if (stopped) {
      return {};
    }

    if (accessor) {
      return accessor[ArgumentStore] || {};
    }
  };
}
