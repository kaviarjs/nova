// import intersectDeep from "../../core/query/lib/intersectDeep";
import * as _ from "lodash";
import * as graphqlFields from "graphql-fields";
import { SPECIAL_PARAM_FIELD, QueryBody } from "../constants";
import Query from "../query/Query";
import intersectDeep from "../query/lib/intersectDeep";
import { Collection } from "mongodb";

const Errors = {
  MAX_DEPTH: "The maximum depth of this request exceeds the depth allowed.",
};

export type AstToQueryOptions = {
  intersect?: QueryBody;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  embody?(body: QueryBody);
};

export function astToBody(ast) {
  const body = graphqlFields(ast, {}, { processArguments: true });
  replaceArgumentsWithOurs(body);

  return body;
}

function replaceArgumentsWithOurs(body: any) {
  _.forEach(body, (value, key) => {
    if (key === "__arguments") {
      let args = {};
      (value as any[]).forEach(argument => {
        _.forEach(argument, (value, key) => {
          args[key] = value.value;
        });
      });
      body[SPECIAL_PARAM_FIELD] = args;
      delete body[key];

      return;
    }

    if (_.isObject(value)) {
      replaceArgumentsWithOurs(value);
    }
  });
}

export default function astToQuery(
  collection: Collection,
  ast,
  config: AstToQueryOptions = {}
) {
  // get the body
  let body = graphqlFields(ast, {}, { processArguments: true });

  body[SPECIAL_PARAM_FIELD] = config[SPECIAL_PARAM_FIELD] || {};

  // enforce the maximum amount of data we allow to retrieve
  if (config.maxLimit) {
    enforceMaxLimit(body[SPECIAL_PARAM_FIELD], config.maxLimit);
  }

  // figure out depth based
  if (config.maxDepth) {
    const currentMaxDepth = getMaxDepth(body);
    if (currentMaxDepth > config.maxDepth) {
      throw Errors.MAX_DEPTH;
    }
  }

  if (config.deny) {
    deny(body, config.deny);
  }

  if (config.intersect) {
    body = intersectDeep(body, config.intersect);
  }

  if (config.embody) {
    config.embody.call(null, body);
  }

  // we return the query
  return new Query(collection, body);
}

export function getMaxDepth(body) {
  const depths = [];
  for (const key in body) {
    if (_.isObject(body[key])) {
      depths.push(getMaxDepth(body[key]));
    }
  }

  if (depths.length === 0) {
    return 1;
  }

  return Math.max(...depths) + 1;
}

export function deny(body, fields) {
  fields.forEach(field => {
    let parts = field.split(".");
    let accessor = body;
    while (parts.length != 0) {
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

function enforceMaxLimit(field: any, maxLimit: number) {
  if (!field.options) {
    field.options = {};
  }

  const options = field.options;

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
export const astQueryToInfo = astToInfo => {
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
};
