import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

/**
 *
 * @param childCollectionNode
 */
export default function processVirtualNode(
  childCollectionNode: CollectionNode
) {
  const parentResults = childCollectionNode.parent.results;
  const collection = childCollectionNode.collection;
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
      parentResult[linkName] = result ? [result] : [];
    });
  }
}

function findMany(parentResult, linkStorageField, childResults) {
  return childResults.filter(childResult => {
    const linkingStorage = _.get(childResult, linkStorageField);
    if (linkingStorage) {
      return linkingStorage.find(
        l => l.toString() === parentResult._id.toString()
      );
    }
  });
}

function findSingle(parentResult, linkStorageField, childResults) {
  return childResults.find(childResult => {
    const linkingStorage = _.get(childResult, linkStorageField);
    return linkingStorage
      ? linkingStorage.toString() === parentResult._id.toString()
      : false;
  });
}
