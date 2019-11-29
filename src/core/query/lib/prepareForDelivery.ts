import * as _ from "lodash";
import applyReducers from "./computeReducers";
import CollectionNode from "../nodes/CollectionNode";
import projectGraphToDataSet from "./projectGraphToDataSet";

export default async node => {
  storeOneResults(node, node.results);
  await applyReducers(node);

  node.results = projectGraphToDataSet(node.body, node.results);
};

export function storeOneResults(node: CollectionNode, sameLevelResults: any[]) {
  if (!sameLevelResults) {
    return;
  }

  node.collectionNodes.forEach(collectionNode => {
    _.forEach(sameLevelResults, result => {
      // The reason we are doing this is that if the requested link does not exist
      // It will fail when we try to get undefined[something] below
      if (result !== undefined) {
        storeOneResults(collectionNode, result[collectionNode.name]);
      }
    });

    if (collectionNode.isOneResult) {
      _.forEach(sameLevelResults, result => {
        if (
          result[collectionNode.name] &&
          _.isArray(result[collectionNode.name])
        ) {
          result[collectionNode.name] =
            result[collectionNode.name].length > 0
              ? _.first(result[collectionNode.name])
              : null;
        }
      });
    }
  });
}
