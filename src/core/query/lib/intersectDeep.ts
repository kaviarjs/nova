import * as _ from "lodash";
import { SPECIAL_PARAM_FIELD } from "../../constants";
import FieldNode from "../nodes/FieldNode";

export default function intersectDeep(what, intersection) {
  const result = {};
  _.forEach(intersection, (value, fieldName) => {
    if (!what[fieldName]) {
      return;
    }

    const isField: boolean = FieldNode.canBodyRepresentAField(value);

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
