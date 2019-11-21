import prepareForDelivery from "../lib/prepareForDelivery";
import storeHypernovaResults from "./storeHypernovaResults";
import CollectionNode from "../nodes/CollectionNode";

async function hypernova(collectionNode: CollectionNode) {
  const collectionNodes = collectionNode.collectionNodes;

  for (const childCollectionNode of collectionNodes) {
    await storeHypernovaResults(childCollectionNode);
    await hypernova(childCollectionNode);
  }
}

export default async function hypernovaInit(collectionNode: CollectionNode) {
  collectionNode.results = await collectionNode.toArray();

  await hypernova(collectionNode);
  await prepareForDelivery(collectionNode);

  return collectionNode.results;
}
