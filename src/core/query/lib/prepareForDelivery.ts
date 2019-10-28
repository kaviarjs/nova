import * as _ from "lodash";
import applyReducers from "./computeReducers";
import CollectionNode from "../nodes/CollectionNode";
import projectGraphToDataSet from "./projectGraphToDataSet";

export default node => {
  storeOneResults(node, node.results);
  applyReducers(node);

  node.results = projectGraphToDataSet(node.body, node.results);
};

/**
 *
 * Helper function which transforms results into the array.
 * Results are an object for 'one' links.
 *
 * @param results
 * @return array
 */
export function getResultsArray(results) {
  if (_.isArray(results)) {
    return results;
  } else if (_.isUndefined(results)) {
    return [];
  }
  return [results];
}

export function storeOneResults(node: CollectionNode, sameLevelResults: any[]) {
  if (!sameLevelResults) {
    return;
  }

  node.collectionNodes.forEach(collectionNode => {
    _.forEach(sameLevelResults, result => {
      // The reason we are doing this is that if the requested link does not exist
      // It will fail when we try to get undefined[something] below
      if (result === undefined) {
        return;
      }

      storeOneResults(collectionNode, result[collectionNode.name]);
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
