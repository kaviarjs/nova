import * as _ from "lodash";
import { SPECIAL_PARAM_FIELD } from "../../constants";
import FieldNode from "./FieldNode";

export default class ProjectionNode {
  public name: string;
  public body: any;
  public nodes: ProjectionNode[] = [];
  public isLeaf: boolean = false;

  constructor(name, body) {
    this.name = name;
    this.body = body;

    if (_.isObject(body)) {
      if (!FieldNode.canBodyRepresentAField(body)) {
        _.forEach(body, (value, fieldName) => {
          if (fieldName !== SPECIAL_PARAM_FIELD) {
            this.nodes.push(new ProjectionNode(fieldName, value));
          }
        });
      }
    }

    this.isLeaf = this.nodes.length === 0;
  }

  public project(object) {
    if (!object) {
      return null;
    }

    if (_.isArray(object)) {
      return object.map(subobject => this.project(subobject));
    }

    const newObject = {};
    this.nodes.forEach(node => {
      newObject[node.name] = node.isLeaf
        ? object[node.name]
        : node.project(object[node.name]);
    });

    return newObject;
  }
}
