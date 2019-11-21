import CollectionNode from "../nodes/CollectionNode";
import processDirectNode from "./processDirectNode";
import processLimitSkipNode from "./processLimitSkipNode";
import processVirtualNode from "./processVirtualNode";

export default async function storeHypernovaResults(
  childCollectionNode: CollectionNode
) {
  if (childCollectionNode.parent.results.length === 0) {
    // There is no sense in continuing with the graph expansion
    return;
  }

  const { filters, options } = childCollectionNode.getFiltersAndOptions();
  const linker = childCollectionNode.linker;
  const isVirtual = linker.isVirtual();

  // When we have a many relationship with limit/skip
  if (!childCollectionNode.isOneResult) {
    /**
     * In this case we perform a recursive fetch, yes, not very optimal
     */
    if (options.limit !== undefined || options.skip !== undefined) {
      processLimitSkipNode(childCollectionNode, { filters, options });
      return;
    }
  }

  childCollectionNode.results = await childCollectionNode.toArray();
  // if it's not virtual then we retrieve them and assemble them here.
  if (!isVirtual) {
    processDirectNode(childCollectionNode);
  } else {
    processVirtualNode(childCollectionNode);
  }
}
