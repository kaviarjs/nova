import { Collection } from "mongodb";
import * as _ from "lodash";
import { QueryBody } from "../constants";
import CollectionNode from "./nodes/CollectionNode";
import hypernova from "./hypernova/hypernova";

export default class Query {
  public collection: Collection;
  private graph: CollectionNode;
  private body: any;
  public queryName: string;

  /**
   * Everythig starts with a query. We build the graph based on the body.
   *
   * @param collection
   * @param body
   */
  constructor(collection: Collection, body: QueryBody) {
    this.collection = collection;
    this.queryName = collection.collectionName;
    this.body = _.cloneDeep(body);
    this.graph = new CollectionNode({
      collection,
      body,
      name: "root",
    });
  }

  /**
   * Retrieves the data.
   *
   * @param context
   * @returns {*}
   */
  public async fetch(): Promise<any[]> {
    return this.toArray();
  }

  public async toArray() {
    return hypernova(this.graph);
  }

  public async fetchOne(): Promise<any> {
    const results = await this.fetch();

    return _.first(results);
  }

  /**
   * Gets the count of matching elements.
   * @returns {integer}
   */
  public getCount() {
    return this.collection.find(this.body.$filters || {}, {}).count();
  }
}
