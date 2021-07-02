import * as _ from "lodash";
import applyReducers from "./computeReducers";
import CollectionNode from "../nodes/CollectionNode";
import projectGraphToDataSet from "./projectGraphToDataSet";

export default async (node: CollectionNode) => {
  storeOneResults(node, node.results);
  await applyReducers(node);

  if (!node.queryAllFields) {
    node.results = projectGraphToDataSet(node.body, node.results);
  }
};

export function storeOneResults(node: CollectionNode, sameLevelResults: any[]) {
  if (!sameLevelResults) {
    return;
  }

  node.collectionNodes.forEach((childCollectionNode) => {
    sameLevelResults.forEach((result) => {
      // The reason we are doing this is that if the requested link does not exist
      // It will fail when we try to get undefined[something] below
      if (result !== undefined) {
        storeOneResults(childCollectionNode, result[childCollectionNode.name]);
      }
    });

    if (childCollectionNode.isOneResult) {
      sameLevelResults.forEach((result) => {
        if (
          result[childCollectionNode.name] &&
          Array.isArray(result[childCollectionNode.name])
        ) {
          result[childCollectionNode.name] =
            result[childCollectionNode.name].length > 0
              ? _.first(result[childCollectionNode.name])
              : null;
        }
      });
    }
  });
}
