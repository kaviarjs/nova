import * as _ from "lodash";
import * as dot from "dot-object";

import {
  SPECIAL_PARAM_FIELD,
  ALIAS_FIELD,
  SCHEMA_FIELD,
  SCHEMA_BSON_DECODER_STORAGE,
  SCHEMA_BSON_LEFTOVER_SERIALIZER,
} from "../../constants";
import {
  QueryBodyType,
  IReducerOption,
  QuerySubBodyType,
  IQueryContext,
} from "../../defs";

import {
  getLinker,
  getReducerConfig,
  getExpanderConfig,
  hasLinker,
} from "../../api";
import Linker from "../Linker";
import { INode } from "./INode";
import FieldNode from "./FieldNode";
import ReducerNode from "./ReducerNode";
import { Collection, ObjectId } from "mongodb";
import { ClassSchema, t, Serializer } from "@deepkit/type";
import { getBSONDecoder } from "@deepkit/bson";
import { SCHEMA_STORAGE, SCHEMA_AGGREGATE_STORAGE } from "../../constants";

const BSONLeftoverSerializer = new Serializer("custom serializer");
BSONLeftoverSerializer.toClass.register("date", (property, compiler) => {
  compiler.addSetter(`new Date(${compiler.accessor})`);
});
BSONLeftoverSerializer.toClass.register("objectId", (property, compiler) => {
  compiler.setContext({
    ObjectId,
  });
  // compiler.addCodeForSetter('const ObjectId = require("mongodb").ObjectId');
  compiler.addSetter(`new ObjectId(${compiler.accessor})`);
});

export interface CollectionNodeOptions {
  collection: Collection;
  body: QueryBodyType;
  explain?: boolean;
  name?: string;
  parent?: CollectionNode;
  linker?: Linker;
}

export enum NodeLinkType {
  COLLECTION,
  FIELD,
  REDUCER,
  EXPANDER,
}

export default class CollectionNode implements INode {
  public body: QuerySubBodyType;
  public name: string;
  public collection: Collection;
  public parent: CollectionNode;
  public alias: string;
  public schema: ClassSchema;

  public nodes: INode[] = [];
  public props: any; // TODO: refator to: ValueOrValueResolver<ICollectionQueryConfig>

  public isVirtual?: boolean;
  public isOneResult?: boolean;

  /**
   * When doing .fetchOne() from the Query and forgetting about hard-coding a limit, we should put that limit ourselves to avoid accidentally large queries
   */
  public forceSingleResult: boolean = false;

  /**
   * When this is true, we are explaining the pipeline, and the given results
   */
  public readonly explain: boolean;

  /**
   * The linker represents how the parent collection node links to the child collection
   */
  public linker: Linker;
  public linkStorageField: string;

  public results: any = [];

  constructor(
    options: CollectionNodeOptions,
    public readonly context: IQueryContext
  ) {
    const { collection, body, name, parent, linker, explain = false } = options;

    if (collection && !_.isObject(body)) {
      throw new Error(
        `The field "${name}" is a collection link, and should have its body defined as an object.`
      );
    }

    this.props = body[SPECIAL_PARAM_FIELD] || {};
    this.alias = body[ALIAS_FIELD];
    this.schema = body[SCHEMA_FIELD];

    this.body = _.cloneDeep(body);
    delete this.body[SPECIAL_PARAM_FIELD];
    delete this.body[ALIAS_FIELD];
    delete this.body[SCHEMA_FIELD];

    this.explain = explain;
    this.name = name;
    this.collection = collection;
    this.parent = parent;

    this.linker = linker;

    if (parent) {
      this.handleSetupForChild();
    }

    this.spread(this.body);
  }

  /**
   * For non-roots,
   */
  private handleSetupForChild() {
    const linker = this.linker;
    const parent = this.parent;

    this.isVirtual = linker.isVirtual();
    this.isOneResult = linker.isOneResult();
    this.linkStorageField = linker.linkStorageField;
    if (this.isVirtual) {
      this.addField(this.linkStorageField, {});
    } else {
      parent.addField(this.linkStorageField, {});
    }
  }

  get collectionNodes(): CollectionNode[] {
    return this.nodes.filter(
      (n) => n instanceof CollectionNode
    ) as CollectionNode[];
  }

  get fieldNodes(): FieldNode[] {
    return this.nodes.filter((n) => n instanceof FieldNode) as FieldNode[];
  }

  get reducerNodes(): ReducerNode[] {
    return this.nodes.filter((n) => n instanceof ReducerNode) as ReducerNode[];
  }

  /**
   * Returns the linker with the field you want
   * @param name {string}
   */
  public getLinker(name: string): Linker {
    if (hasLinker(this.collection, name)) {
      return getLinker(this.collection, name);
    }

    return null;
  }

  public getReducer(name: string): ReducerNode {
    return this.reducerNodes.find((node) => node.name === name);
  }

  public getReducerConfig(name: string): IReducerOption {
    return getReducerConfig(this.collection, name);
  }

  public getExpanderConfig(name: string): QueryBodyType {
    return getExpanderConfig(this.collection, name);
  }

  /**
   * Returns the filters and options needed to fetch this node
   * The argument parentObject is given when we perform recursive fetches
   */
  public getPropsForQuerying(
    parentObject?: any
  ): {
    filters: any;
    options: any;
    pipeline: any[];
    decoder: Function;
  } {
    let props =
      typeof this.props === "function"
        ? this.props(parentObject)
        : _.cloneDeep(this.props);

    let { filters = {}, options = {}, pipeline = [], decoder } = props;

    options.projection = this.blendInProjection(options.projection);

    return {
      filters,
      options,
      pipeline,
      decoder,
    };
  }

  /**
   * Creates the projection object based on all the fields and reducers
   * @param projection
   */
  public blendInProjection(projection) {
    if (!projection) {
      projection = {};
    }

    this.fieldNodes.forEach((fieldNode) => {
      fieldNode.blendInProjection(projection);
    });

    this.reducerNodes.forEach((reducerNode) => {
      reducerNode.blendInProjection(projection);
    });

    if (!projection._id) {
      projection._id = 1;
    }

    return projection;
  }

  /**
   * @param fieldName
   * @returns {boolean}
   */
  public hasField(fieldName) {
    return this.fieldNodes.find((fieldNode) => fieldNode.name === fieldName);
  }

  /**
   * @param fieldName
   * @returns {FieldNode}
   */
  public getFirstLevelField(fieldName) {
    return this.fieldNodes.find((fieldNode) => {
      return fieldNode.name === fieldName;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasCollectionNode(name) {
    return !!this.collectionNodes.find((node) => {
      return node.name === name;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasReducerNode(name) {
    return !!this.reducerNodes.find((node) => node.name === name);
  }

  /**
   * @param name
   * @returns {ReducerNode}
   */
  public getReducerNode(name) {
    return this.reducerNodes.find((node) => node.name === name);
  }

  /**
   * @param name
   * @returns {CollectionNode}
   */
  public getCollectionNode(name) {
    return this.collectionNodes.find((node) => node.name === name);
  }

  /**
   * Fetches the data accordingly
   */
  public async toArray(additionalFilters = {}, parentObject?: any) {
    const pipeline = this.getAggregationPipeline(
      additionalFilters,
      parentObject
    );

    if (this.explain) {
      console.log(
        `[${this.name}] Pipeline:\n`,
        JSON.stringify(pipeline, null, 2)
      );
    }

    let results,
      schema = this.schema,
      decoder,
      serializer,
      aggregateSchema;

    if (schema) {
      aggregateSchema = CollectionNode.getAggregateSchema(schema);
      decoder = getBSONDecoder(aggregateSchema);
      serializer = CollectionNode.getSchemaSerializer(schema);
    } else if (schema === undefined) {
      if (this.collection[SCHEMA_STORAGE]) {
        schema = this.collection[SCHEMA_STORAGE];
        aggregateSchema = this.collection[SCHEMA_AGGREGATE_STORAGE];
        decoder = this.collection[SCHEMA_BSON_DECODER_STORAGE];
        serializer = this.collection[SCHEMA_BSON_LEFTOVER_SERIALIZER];
      }
    }
    if (schema) {
      // @types/mongodb complains about `batchSize` not being a valid option, it's a false issue
      // @ts-ignore
      const buffers = await this.collection
        .aggregate(pipeline, {
          allowDiskUse: true,
          raw: true,
          batchSize: 1_000_000,
        })
        .toArray();

      const result = decoder(buffers[0]);
      if (result.errmsg) {
        throw new Error(JSON.stringify(result));
      }

      const firstBatchResults = result.cursor.firstBatch;

      return firstBatchResults.map((result) => serializer.deserialize(result));
    } else {
      results = await this.collection
        .aggregate(pipeline, {
          allowDiskUse: true,
        })
        .toArray();
    }

    if (this.explain) {
      console.log(
        `[${this.name}] Results:\n`,
        JSON.stringify(results, null, 2)
      );
    }

    if (!results) {
      return [];
    }

    return results;
  }

  /**
   * @param fieldName
   */
  public getLinkingType(fieldName): NodeLinkType {
    if (this.getLinker(fieldName)) {
      return NodeLinkType.COLLECTION;
    }

    if (this.getReducerConfig(fieldName)) {
      return NodeLinkType.REDUCER;
    }

    if (this.getExpanderConfig(fieldName)) {
      return NodeLinkType.EXPANDER;
    }

    return NodeLinkType.FIELD;
  }

  /**
   * Based on the current configuration fetches the pipeline
   */
  public getAggregationPipeline(
    additionalFilters = {},
    parentObject?: any
  ): any[] {
    const {
      filters,
      options,
      pipeline: pipelineFromProps,
    } = this.getPropsForQuerying(parentObject);

    const pipeline = [];
    Object.assign(filters, additionalFilters);
    if (this.linker) {
      Object.assign(
        filters,
        this.linker.getHardwiredFilters({
          filters,
        })
      );
    }

    if (!_.isEmpty(filters)) {
      pipeline.push({ $match: filters });
    }

    // TODO: transform filters to extract $geoNear, $near and $nearSphere

    pipeline.push(...pipelineFromProps);

    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }

    this.reducerNodes.forEach((reducerNode) => {
      pipeline.push(...reducerNode.pipeline);
    });

    let limit = options.limit;
    if (this.forceSingleResult) {
      limit = 1;
    }

    if (limit) {
      if (!options.skip) {
        options.skip = 0;
      }
      pipeline.push({
        $limit: limit + options.skip,
      });
    }

    if (options.skip) {
      pipeline.push({
        $skip: options.skip,
      });
    }

    if (options.projection) {
      pipeline.push({
        $project: options.projection,
      });
    }

    return pipeline;
  }

  /**
   * This function creates the children properly for my root.
   */
  private spread(body: QuerySubBodyType, fromReducerNode?: ReducerNode) {
    _.forEach(body, (fieldBody, fieldName) => {
      if (!fieldBody) {
        return;
      }

      if (fieldName === SPECIAL_PARAM_FIELD || fieldName === SCHEMA_FIELD) {
        return;
      }

      let alias = fieldName;
      if (fieldBody[ALIAS_FIELD]) {
        alias = fieldBody[ALIAS_FIELD];
      }

      const linkType = this.getLinkingType(alias);

      let childNode: INode;

      switch (linkType) {
        case NodeLinkType.COLLECTION:
          if (this.hasCollectionNode(alias)) {
            this.getCollectionNode(alias).spread(fieldBody as QueryBodyType);
            return;
          }

          const linker = this.getLinker(alias);

          childNode = new CollectionNode(
            {
              body: fieldBody as QueryBodyType,
              collection: linker.getLinkedCollection(),
              linker,
              name: fieldName,
              parent: this,
            },
            this.context
          );
          break;
        case NodeLinkType.REDUCER:
          const reducerConfig = this.getReducerConfig(fieldName);

          childNode = new ReducerNode(
            fieldName,
            {
              body: fieldBody as QueryBodyType,
              ...reducerConfig,
            },
            this.context
          );

          /**
           * This scenario is when a reducer is using another reducer
           */
          if (fromReducerNode) {
            fromReducerNode.dependencies.push(childNode);
          }

          break;
        case NodeLinkType.EXPANDER:
          const expanderConfig = this.getExpanderConfig(fieldName);
          _.merge(this.body, expanderConfig);
          delete this.body[fieldName];

          return this.spread(expanderConfig);
        case NodeLinkType.FIELD:
          this.addField(fieldName, fieldBody);
          return;
      }

      if (childNode) {
        this.nodes.push(childNode);
      }
    });

    // If by the end of parsing the body, we have no fields, we add one regardless
    if (this.fieldNodes.length === 0) {
      const fieldNode = new FieldNode("_id", {});
      this.nodes.push(fieldNode);
    }

    this.blendReducers();
  }

  /**
   *
   * @param fieldName
   * @param body
   */
  private addField(fieldName: string, body) {
    if (fieldName.indexOf(".") > -1) {
      // transform 'profile.firstName': body => { "profile" : { "firstName": body } }
      const newBody = dot.object({ [fieldName]: body });
      fieldName = fieldName.split(".")[0];
      body = newBody[fieldName];
    }

    if (!this.hasField(fieldName)) {
      const fieldNode = new FieldNode(fieldName, body);

      this.nodes.push(fieldNode);
    } else {
      // In case it contains some sub fields
      const fieldNode = this.getFirstLevelField(fieldName);
      if (FieldNode.canBodyRepresentAField(body)) {
        if (fieldNode.subfields.length > 0) {
          // We override it, so we include everything
          fieldNode.subfields = [];
        }
      } else {
        fieldNode.spread(body);
      }
    }
  }

  protected blendReducers() {
    this.reducerNodes
      .filter((node) => !node.isSpread)
      .forEach((reducerNode) => {
        reducerNode.isSpread = true;
        this.spread(reducerNode.dependency, reducerNode);
      });
  }

  public static getSchemaSerializer(resultSchema: ClassSchema) {
    return BSONLeftoverSerializer.for(resultSchema);
  }

  public static getAggregateSchema(resultSchema: ClassSchema) {
    return t.schema({
      ok: t.number,
      errmsg: t.string.optional,
      code: t.number.optional,
      codeName: t.string.optional,
      cursor: {
        id: t.number,
        firstBatch: t.array(t.partial(resultSchema)),
        nextBatch: t.array(t.partial(resultSchema)),
      },
    });
  }
}
