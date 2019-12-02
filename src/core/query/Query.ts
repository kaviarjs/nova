import { Collection } from "mongodb";
import * as _ from "lodash";
import { CollectionQueryBody } from "../constants";
import CollectionNode from "./nodes/CollectionNode";
import hypernova from "./hypernova/hypernova";

export default class Query {
  public collection: Collection;
  private graph: CollectionNode;
  public readonly body: any;
  public queryName: string;

  /**
   * Everythig starts with a query. We build the graph based on the body.
   *
   * @param collection
   * @param body
   */
  constructor(collection: Collection, body: CollectionQueryBody) {
    this.collection = collection;
    this.queryName = collection.collectionName;
    this.body = _.cloneDeep(body);
    this.graph = new CollectionNode({
      collection,
      body,
      name: "root"
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
}
