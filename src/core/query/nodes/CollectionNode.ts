import { Collection } from "mongodb";
import * as _ from "lodash";
import { SPECIAL_PARAM_FIELD } from "../../constants";
import { getLinker, getReducerConfig, getExpanderConfig } from "../../api";
import { INode } from "./INode";
import FieldNode from "./FieldNode";
import ReducerNode from "./ReducerNode";
import { QueryBody, ReducerOption } from "../../constants";
import Linker from "../Linker";
import * as dot from "dot-object";
import { createFilters } from "../lib/createFilters";

export type CollectionNodeOptions = {
  collection: Collection;
  body: QueryBody;
  name?: string;
  parent?: CollectionNode;
  linker?: Linker;
};

export enum NodeLinkType {
  COLLECTION,
  FIELD,
  REDUCER,
  EXPANDER
}

export default class CollectionNode implements INode {
  public body: QueryBody;
  public name: string;
  public collection: Collection;
  public parent: CollectionNode;

  public nodes: INode[] = [];

  public props: any;

  public isVirtual?: boolean;
  public isOneResult?: boolean;

  /**
   * The linker represents how the parent collection node links to the child collection
   */
  public linker: Linker;
  public linkStorageField: string;

  public results: any = [];

  constructor(options: CollectionNodeOptions) {
    const { collection, body, name, parent, linker } = options;

    if (collection && !_.isObject(body)) {
      throw new Error(
        `The field "${name}" is a collection link, and should have its body defined as an object.`
      );
    }

    this.body = body;
    this.props = this.body[SPECIAL_PARAM_FIELD] || {};

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
      n => n instanceof CollectionNode
    ) as CollectionNode[];
  }

  get fieldNodes(): FieldNode[] {
    return this.nodes.filter(n => n instanceof FieldNode) as FieldNode[];
  }

  get reducerNodes(): ReducerNode[] {
    return this.nodes.filter(n => n instanceof ReducerNode) as ReducerNode[];
  }

  /**
   * Returns the linker with the field you want
   * @param name {string}
   */
  public getLinker(name: string): Linker {
    return getLinker(this.collection, name);
  }

  public getReducer(name: string): ReducerNode {
    return this.reducerNodes.find(node => node.name === name);
  }

  public getReducerConfig(name: string): ReducerOption {
    return getReducerConfig(this.collection, name);
  }

  public getExpanderConfig(name: string): QueryBody {
    return getExpanderConfig(this.collection, name);
  }

  /**
   * Returns the filters and options needed to fetch this node
   * Is aware if it has a parent or not
   */
  public getFiltersAndOptions(
    config: { includeFilterFields?: boolean } = {}
  ): {
    filters: any;
    options: any;
  } {
    const { filters = {}, options = {} } = _.cloneDeep(this.props);

    if (this.parent) {
      const aggregateFilters = createFilters(this);
      Object.assign(filters, aggregateFilters);
    }

    options.projection = options.projection || {};

    this.fieldNodes.forEach(fieldNode => {
      fieldNode.blendInProjection(options.projection);
    });

    if (config.includeFilterFields) {
      // We have to create a list of fields that we apply to projection
      // Based on the filters
    }

    if (!options.projection._id) {
      options.projection._id = 1;
    }

    return {
      filters,
      options
    };
  }

  /**
   * Tests if it has a field including nesting
   *
   * @param fieldName
   * @returns {boolean}
   */
  public hasField(fieldName) {
    const parts = fieldName.split(".");
    const currentField = this.getFirstLevelField(parts[0]);

    if (currentField) {
      if (parts.length === 1 || currentField.subfields.length === 0) {
        return true;
      }

      return currentField.hasField(parts.slice(1).join("."));
    }

    return false;
  }

  /**
   * @param fieldName
   * @returns {FieldNode}
   */
  public getFirstLevelField(fieldName) {
    return this.fieldNodes.find(fieldNode => {
      return fieldNode.name === fieldName;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasCollectionNode(name) {
    return !!this.collectionNodes.find(node => {
      return node.name === name;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasReducerNode(name) {
    return !!this.reducerNodes.find(node => node.name === name);
  }

  /**
   * @param name
   * @returns {ReducerNode}
   */
  public getReducerNode(name) {
    return this.reducerNodes.find(node => node.name === name);
  }

  /**
   * @param name
   * @returns {CollectionNode}
   */
  public getCollectionNode(name) {
    return this.collectionNodes.find(node => node.name === name);
  }

  /**
   * Fetches the data accordingly
   */
  public async toArray() {
    return this.collection
      .aggregate(this.getAggregationPipeline(), {
        allowDiskUse: true
      })
      .toArray();
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
  public getAggregationPipeline(): any[] {
    const { filters, options } = this.getFiltersAndOptions();
    const pipeline = [];

    if (!_.isEmpty(filters)) {
      pipeline.push({ $match: filters });
    }

    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }

    if (this.props.pipeline) {
      pipeline.push(...this.props.pipeline);

      this.reducerNodes.forEach(reducerNode => {
        pipeline.push(...reducerNode.pipeline);
      });
    }

    if (options.limit) {
      if (!options.skip) {
        options.skip = 0;
      }
      pipeline.push({
        $limit: options.limit + options.skip
      });
    }

    if (options.skip) {
      pipeline.push({
        $skip: options.skip
      });
    }

    if (options.projection) {
      pipeline.push({
        $project: options.projection
      });
    }

    return pipeline;
  }

  /**
   * This function creates the children properly for my root.
   */
  private spread(body, fromReducerNode?: ReducerNode) {
    _.forEach(body, (fieldBody, fieldName) => {
      if (!fieldBody) {
        return;
      }
      if (fieldName === SPECIAL_PARAM_FIELD) {
        return;
      }

      const linkType = this.getLinkingType(fieldName);
      let childNode: INode;

      switch (linkType) {
        case NodeLinkType.COLLECTION:
          if (this.hasCollectionNode(fieldName)) {
            this.getCollectionNode(fieldName).spread(fieldBody);
            return;
          }

          const linker = this.getLinker(fieldName);

          childNode = new CollectionNode({
            body: fieldBody as QueryBody,
            collection: linker.getLinkedCollection(),
            linker,
            name: fieldName,
            parent: this
          });
          break;
        case NodeLinkType.REDUCER:
          const reducerConfig = this.getReducerConfig(fieldName);

          childNode = new ReducerNode(fieldName, {
            body: fieldBody,
            dependency: reducerConfig.dependency,
            reduce: reducerConfig.reduce
          });

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

  private blendReducers() {
    this.reducerNodes
      .filter(node => !node.isSpread)
      .forEach(reducerNode => {
        reducerNode.isSpread = true;
        this.spread(reducerNode.dependency, reducerNode);
      });
  }
}
