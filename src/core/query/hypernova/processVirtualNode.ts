import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";
import { idsEqual } from "../../../__tests__/integration/helpers";

/**
 *
 * @param childCollectionNode
 */
export default function processVirtualNode(
  childCollectionNode: CollectionNode
) {
  const parentResults = childCollectionNode.parent.results;
  const linkStorageField = childCollectionNode.linkStorageField;
  const linkName = childCollectionNode.name;
  const isMany = childCollectionNode.linker.isMany();

  if (isMany) {
    parentResults.forEach(parentResult => {
      parentResult[linkName] = findMany(
        parentResult,
        linkStorageField,
        childCollectionNode.results
      );
    });
  } else {
    parentResults.forEach(parentResult => {
      const result = findSingle(
        parentResult,
        linkStorageField,
        childCollectionNode.results
      );
      parentResult[linkName] = result ? result : [];
    });
  }
}

function findMany(parentResult, linkStorageField, childResults) {
  return childResults.filter(childResult => {
    const linkingStorage = _.get(childResult, linkStorageField);
    if (linkingStorage) {
      return linkingStorage.find(l => idsEqual(l, parentResult._id));
    }
  });
}

function findSingle(parentResult, linkStorageField, childResults) {
  return childResults.filter(childResult => {
    const linkingStorage = _.get(childResult, linkStorageField);
    return linkingStorage
      ? idsEqual(linkingStorage, parentResult._id.toString())
      : false;
  });
}
