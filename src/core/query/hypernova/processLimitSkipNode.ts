import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

/**
 * This function is called only when the child collection is a many result and when limit or sort are passed
 * Many results are in the following situations: 1:M (virtual), 1:M (direct), M:M (virtual), M:M (direct)
 *
 * Depending on the relationship between parent and child, we recursively fetch our results,
 * Then we create a unique set of them so they can be properly assembled
 *
 * This solution can be optimised if there are no collisions
 * If there are many "shared" linked elements, the optimal way would be to fetch the _id's first, then fetch all by _id's
 * And then assemble them.
 *
 * @param childCollectionNode
 */
export default async function processLimitSkipNode(
  childCollectionNode: CollectionNode,
  { filters, options }: any
) {
  const parentResults = childCollectionNode.parent.results;
  const collection = childCollectionNode.collection;
  const allResults = [];
  const linkStorageField = childCollectionNode.linkStorageField;
  const linkName = childCollectionNode.name;

  if (childCollectionNode.isVirtual) {
    // Then it's either 1:M either M:M
    // Lucky for us $in works with both arrays and strings, so there's no distinction in the filter
    for (const parentResult of parentResults) {
      const results = await collection
        .find(
          {
            ...filters,
            [linkStorageField]: { $in: [parentResult._id] }
          },
          options
        )
        .toArray();

      allResults.push(...results);
      parentResult[linkName] = results;
    }
  } else {
    // This means the parent stores something like tagIds: [id1, id2, ...]
    for (const parentResult of parentResults) {
      if (!parentResult[linkStorageField]) {
        parentResult[linkStorageField] = [];
        continue;
      }

      const results = await collection
        .find(
          {
            ...filters,
            _id: { $in: parentResult[linkStorageField] }
          },
          options
        )
        .toArray();

      allResults.push(...results);
      parentResult[linkName] = results;
    }
  }

  childCollectionNode.results = _.uniqBy(allResults, "_id");
}
