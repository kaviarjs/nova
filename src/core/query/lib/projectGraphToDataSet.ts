import * as _ from "lodash";
import ProjectionNode from "../nodes/ProjectionNode";

/**
 * Ensures the dataset is matching the graph's projection
 * {a:1}, [{a: 5, b: 5}] => [{a: 5}]
 * @param {*} projection
 * @param {*} results
 */
export default function projectGraphToDataSet(projection, results: any[]) {
  const projectionNode = new ProjectionNode("root", projection);

  return results.map(result => {
    return projectionNode.project(result);
  });
}
