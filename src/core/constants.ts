import { QueryBody } from "./constants";
import * as mongodb from "mongodb";

export const LINK_STORAGE = Symbol("linkStorage");
export const REDUCER_STORAGE = Symbol("reducerStorage");
export const EXPANDER_STORAGE = Symbol("expandersStorage");
export const SPECIAL_PARAM_FIELD = "$";

export type FindOptions = {
  [key: string]: any;
};

export const LinkCollectionOptionsDefaults = {
  type: "one",
  index: true,
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
  dependency: QueryBody;
  reduce: (object: any, params?: any) => any;
};

export type LinkOptions = {
  [key: string]: LinkCollectionOptions;
};

export type ReducerOptions = {
  [key: string]: ReducerOption;
};

export type ExpanderOptions = {
  [key: string]: QueryBody;
};

export type FieldMapOptions = {
  [key: string]: string;
};

export type ParamaterableObject = {
  $: {
    [key: string]: any;
  };
};

export type QueryBody = {
  [field: string]: number | QueryBody | ParamaterableObject;
};
