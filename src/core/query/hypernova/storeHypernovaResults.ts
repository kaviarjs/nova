import * as _ from "lodash";
import assemble from "./processDirectNode";
import CollectionNode from "../nodes/CollectionNode";
import { createFilters } from "./createFilters";
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
  const collection = childCollectionNode.collection;

  // If we're talking about many things
  if (!childCollectionNode.isOneResult) {
    if (options.limit !== undefined || options.skip !== undefined) {
      processLimitSkipNode(childCollectionNode, { filters, options });
      return;
    }
  }

  const aggregateFilters = createFilters(childCollectionNode);
  Object.assign(filters, aggregateFilters);

  // if it's not virtual then we retrieve them and assemble them here.
  if (!isVirtual) {
    childCollectionNode.results = await collection
      .find(filters, options)
      .toArray();

    assemble(childCollectionNode, options);
  } else {
    childCollectionNode.results = await collection
      .find(filters, options)
      .toArray();

    processVirtualNode(childCollectionNode);
  }
}
