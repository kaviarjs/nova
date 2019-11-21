import { QueryBody, ReducerOption } from "../../constants";
import { SPECIAL_PARAM_FIELD } from "../../constants";
import { INode } from "./INode";

type ReducerNodeOptions = ReducerOption & {
  body: QueryBody;
};

export default class ReducerNode implements INode {
  public name: string;
  public props: any;
  public isSpread: boolean = false;

  public reduceFunction: any;
  public pipeline: any[];

  // This refers to the graph dependency
  public dependency: QueryBody;

  // This is a list of reducer nodes this uses
  public dependencies: any = [];

  constructor(name, options: ReducerNodeOptions) {
    this.name = name;
    this.reduceFunction = options.reduce;
    this.dependency = options.dependency;
    this.pipeline = options.pipeline || [];
    this.props = options.body[SPECIAL_PARAM_FIELD] || {};
  }

  /**
   * When computing we also pass the parameters
   *
   * @param {*} object
   * @param {*} args
   */
  public async compute(object) {
    object[this.name] = await this.reduce.call(this, object, this.props);
  }

  public async reduce(object, ...args) {
    return this.reduceFunction.call(this, object, ...args);
  }
}
