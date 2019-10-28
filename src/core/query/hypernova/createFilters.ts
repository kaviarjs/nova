import * as _ from "lodash";
import { LinkStrategy } from "../Linker";
import CollectionNode from "../nodes/CollectionNode";

/**
 * Returns the filters that this collection needs to get all results
 * @param childCollectionNode
 */
export function createFilters(childCollectionNode: CollectionNode) {
  const linker = childCollectionNode.linker;
  const isVirtual = linker.isVirtual();
  const linkStorageField = linker.linkStorageField;
  const parentResults = childCollectionNode.parent.results;
  const isMany = linker.strategy === LinkStrategy.MANY;

  if (isVirtual) {
    if (isMany) {
      return createManyVirtual(parentResults, linkStorageField);
    } else {
      return createOneVirtual(parentResults, linkStorageField);
    }
  } else {
    if (isMany) {
      return createManyDirect(parentResults, linkStorageField);
    } else {
      return createOneDirect(parentResults, linkStorageField);
    }
  }
}

function createOneDirect(parentResults: any[], linkStorageField: string) {
  return {
    _id: {
      $in: _.uniq(
        _.map(parentResults, e => {
          return _.get(e, linkStorageField);
        }).filter(el => el !== undefined)
      ),
    },
  };
}

function createOneVirtual(parentResults: any[], linkStorageField: string) {
  return {
    [linkStorageField]: {
      $in: _.uniq(_.map(parentResults, "_id")),
    },
  };
}

function createManyDirect(parentResults: any[], linkStorageField: string) {
  const arrayOfIds: any[] = _.flatten(
    _.map(parentResults, e => _.get(e, linkStorageField))
  ).filter(e => e !== undefined);

  return {
    _id: {
      $in: _.uniq(arrayOfIds),
    },
  };
}

function createManyVirtual(parentResults: any[], linkStorageField: string) {
  const arrayOfIds = _.flatten(_.map(parentResults, "_id"));
  return {
    [linkStorageField]: {
      $in: _.uniq(arrayOfIds),
    },
  };
}
