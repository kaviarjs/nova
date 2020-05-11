export interface IToArrayable {
  toArray(): Promise<any[]>;
}

export interface ICollection {
  aggregate(
    pipeline: any[],
    options?: {
      allowDiskUse: boolean;
      [key: string]: any;
    }
  ): IToArrayable;
  collectionName: string;
}

export type AstToQueryOptions = {
  intersect?: QueryBody;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  embody?(body: QueryBody, getArguments: (path: string) => any);
};

export type StorageDataType = {
  links: LinkOptions;
  reducers: ReducerOptions;
  expanders: ExpanderOptions;
};

export type FindOptions = {
  [key: string]: any;
};

export type LinkCollectionOptions = {
  collection: () => ICollection;
  field?: string;
  unique?: boolean;
  many?: boolean;
  /**
   * Applicable only when the link is on the other side
   */
  inversedBy?: string;
};

export type ReducerOption = {
  dependency: QueryBody;
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
  [key: string]: QueryBody;
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

export type QueryBody = {
  $?: Functionable<ParamaterableObject>;
  $alias?: string;
  [field: string]: string | number | QueryBody | ParamaterableObject;
};
