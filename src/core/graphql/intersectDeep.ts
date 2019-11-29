import * as _ from "lodash";
import FieldNode from "../query/nodes/FieldNode";
import { ArgumentStore } from "./astToQuery";

export default function intersectDeep(what, intersection) {
  const result = {};
  if (what[ArgumentStore]) {
    result[ArgumentStore] = what[ArgumentStore];
  }

  _.forEach(intersection, (value, fieldName) => {
    if (!what[fieldName]) {
      return;
    }

    const isField = FieldNode.canBodyRepresentAField(value);

    if (isField) {
      result[fieldName] = what[fieldName];
      return;
    }

    const intersection = intersectDeep(what[fieldName], value);
    if (!_.isEmpty(intersection)) {
      result[fieldName] = intersection;
    }
  });

  return result;
}
