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
  const { filters, options } = collectionNode.getFiltersAndOptions();

  const collection = collectionNode.collection;

  collectionNode.results = await collection.find(filters, options).toArray();

  await hypernova(collectionNode);
  prepareForDelivery(collectionNode);

  return collectionNode.results;
}
