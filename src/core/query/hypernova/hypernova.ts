import prepareForDelivery from "../lib/prepareForDelivery";
import storeHypernovaResults from "./storeHypernovaResults";
import CollectionNode from "../nodes/CollectionNode";

async function hypernovaRecursive(collectionNode: CollectionNode) {
  const collectionNodes = collectionNode.collectionNodes;

  const promises = [];

  for (const childCollectionNode of collectionNodes) {
    promises.push(
      storeHypernovaResults(childCollectionNode).then(() =>
        hypernovaRecursive(childCollectionNode)
      )
    );
  }

  await Promise.all(promises);
}

export default async function hypernova(collectionNode: CollectionNode) {
  collectionNode.results = await collectionNode.toArray();

  await hypernovaRecursive(collectionNode);
  await prepareForDelivery(collectionNode);

  return collectionNode.results;
}
