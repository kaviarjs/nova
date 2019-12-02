import * as mongodb from "mongodb";

export const LINK_STORAGE = Symbol("linkStorage");
export const REDUCER_STORAGE = Symbol("reducerStorage");
export const EXPANDER_STORAGE = Symbol("expandersStorage");
export const SPECIAL_PARAM_FIELD = "$";
export const ALIAS_FIELD = "$alias";

export const SPECIAL_FIELDS = [SPECIAL_PARAM_FIELD, ALIAS_FIELD];

export type FindOptions = {
  [key: string]: any;
};

export const LinkCollectionOptionsDefaults = {
  type: "one",
  index: true
};

export type LinkCollectionOptions = {
  collection: () => mongodb.Collection;
  field?: string;
  index?: boolean;
  unique?: boolean;
  many?: boolean;
  /**
   * Applicable only when the link is on the other side
   */
  inversedBy?: string;
};

export type ReducerOption = {
  dependency: CollectionQueryBody;
  pipeline?: any[];
  projection?: any;
  reduce?: (object: any, params?: any) => any;
};

export type LinkOptions = {
  [key: string]: LinkCollectionOptions;
};

export type ReducerOptions = {
  [key: string]: ReducerOption;
};

export type ExpanderOptions = {
  [key: string]: CollectionQueryBody;
};

export type FieldMapOptions = {
  [key: string]: string;
};

export type Functionable<T> = ((...args: any[]) => T) | T;

export type ParamaterableObject = {
  filters?: any;
  options?: {
    limit?: number;
    skip?: number;
    sort?: {
      [key: string]: any;
    };
  };
  pipeline?: any[];
  [key: string]: any;
};

export type CollectionQueryBody = {
  $?: Functionable<ParamaterableObject>;
  $alias?: string;
  [field: string]: string | number | CollectionQueryBody | ParamaterableObject;
};
