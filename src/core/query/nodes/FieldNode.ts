import { QueryBody, SPECIAL_PARAM_FIELD } from "../../constants";
import * as _ from "lodash";
import { INode } from "./INode";
import * as dot from "dot-object";

const PROJECTION_FIELDS = ["$filter"];

export default class FieldNode implements INode {
  /**
   * We have fields like: 1, {}, { $: {...} }, { $filter: {...} }
   * @param body
   */
  public static canBodyRepresentAField(body: any) {
    if (body === 1 || body === true) {
      return true;
    }

    if (_.isObject(body)) {
      if (FieldNode.isProjectionField(body)) {
        return true;
      }

      const keys = Object.keys(body);

      if (keys.length === 0) {
        return true;
      }

      if (keys.length === 1 && body[SPECIAL_PARAM_FIELD]) {
        return true;
      }
    }

    return false;
  }

  public static isProjectionField(body: any) {
    const keys = Object.keys(body);

    return keys.length === 1 && PROJECTION_FIELDS.includes(keys[0]);
  }

  public name: any;
  public projectionOperator: any;
  public body: number | QueryBody;
  public isProjectionField: boolean;
  public subfields: FieldNode[] = [];

  constructor(name: string, body?: number | QueryBody) {
    this.name = name;
    if (name.indexOf(".") > -1) {
      throw new Error(`Please specify the nested field as an object`);
    }

    this.body = body;
    this.isProjectionField = FieldNode.isProjectionField(this.body);
    if (!this.isProjectionField) {
      this.spread(this.body);
    }
  }

  public spread(body: any) {
    if (_.isObject(body)) {
      _.forEach(body, (fieldBody, fieldName) => {
        const fieldNode = new FieldNode(fieldName, fieldBody);

        this.subfields.push(fieldNode);
      });
    }
  }

  public blendInProjection(projection: object) {
    if (this.subfields.length === 0) {
      projection[this.name] = this.isProjectionField ? this.body : 1;

      return;
    }

    const obj = { [this.name]: this.getFieldTreeAsObject() };

    Object.assign(projection, dot.dot(obj));
  }

  public addField(fieldName): FieldNode {
    const parts = fieldName.split(".");
    const node = new FieldNode(parts[0], this.toQueryBody(parts.slice(1)));

    return node;
  }

  public hasField(fieldName): boolean {
    const parts = fieldName.split(".");
    const foundField = this.subfields.find(node => node.name === fieldName);

    if (!foundField) {
      return false;
    }

    if (parts.length === 1) {
      return true;
    }

    return foundField.hasField(parts.slice(1).join("."));
  }

  /**
   * This works for composed fields that have subfields
   */
  public getFieldTreeAsObject(): object | number {
    if (this.subfields.length === 0) {
      return 1;
    }

    const obj = {};

    this.subfields.forEach(fieldNode => {
      obj[fieldNode.name] = fieldNode.getFieldTreeAsObject();
    });

    return obj;
  }

  /**
   * Transforms ['a', 'b', 'c'] to { a: { b : { c: 1 }}}
   * @param parts
   */
  public toQueryBody(parts: any[]): QueryBody {
    const object = {};

    let path = object;
    parts.forEach(part => {
      path[part] = {};
      path = object[part];
    });

    return object;
  }
}
