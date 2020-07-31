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

export interface IAstToQueryOptions {
  intersect?: IQueryBody;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  filters?: any;
  options?: any;
  embody?(body: IQueryBody, getArguments: (path: string) => any);
}

export interface IStorageData {
  links: ILinkOptions;
  reducers: IReducerOptions;
  expanders: IExpanderOptions;
}

export interface IFindOptions {
  [key: string]: any;
}

export interface ILinkCollectionOptions {
  collection: () => ICollection;
  field?: string;
  unique?: boolean;
  many?: boolean;
  /**
   * Applicable only when the link is on the other side
   */
  inversedBy?: string;
}

export interface IReducerOption {
  dependency: IQueryBody;
  pipeline?: any[];
  projection?: any;
  reduce?: (object: any, params?: any) => any;
}

export interface ILinkOptions {
  [key: string]: ILinkCollectionOptions;
}

export interface IReducerOptions {
  [key: string]: IReducerOption;
}

export interface IExpanderOptions {
  [key: string]: IQueryBody;
}

export interface IFieldMapOptions {
  [key: string]: string;
}

export type Functionable<T> = T | ((...args: any[]) => T);

export interface IQueryOptions {
  limit?: number;
  skip?: number;
  sort?: {
    [key: string]: any;
  };
}

export interface IParamaterableObject {
  filters?: any;
  options?: IQueryOptions;
  pipeline?: any[];
  [key: string]: any;
}

export interface IQueryBody {
  $?: Functionable<IParamaterableObject>;
  $alias?: string;
  [field: string]: string | number | IQueryBody | IParamaterableObject;
}
