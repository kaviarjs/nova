import { FilterQuery } from "mongodb";

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

export interface IQueryContext {
  // Do be extended by others
}

export interface IAstToQueryOptions<T = null> {
  intersect?: QueryBodyType<T>;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  filters?: any;
  options?: any;
  embody?(body: QueryBodyType<T>, getArguments: (path: string) => any);
  /**
   * This gets deeply merged with the body (useful for $ argument)
   */
  sideBody?: QueryBodyType<T>;
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

type AnyObject = { [key: string]: any };
export interface IReducerOption<
  ReturnType = any,
  ParamsType = AnyObject,
  ParentType = any
> {
  dependency: QueryBodyType;
  pipeline?: any[];
  projection?: any;
  reduce?: (
    object: ParentType,
    params?: { context: IQueryContext } & ParamsType
  ) => ReturnType | Promise<ReturnType>;
}

export interface ILinkOptions {
  [key: string]: ILinkCollectionOptions;
}

export interface IReducerOptions {
  [key: string]: IReducerOption;
}

export interface IExpanderOptions {
  [key: string]: QueryBodyType;
}

export interface IFieldMapOptions {
  [key: string]: string;
}

export type ValueOrValueResolver<T> = T | ((...args: any[]) => T);

/**
 * @deprecated Use QueryBody type instead to ensure type safety.
 */
export interface IQueryBody {
  $?: ICollectionQueryConfig | ValueOrValueResolver<ICollectionQueryConfig>;
  $alias?: string;
  [field: string]:
    | string
    | number
    | IQueryBody
    | ICollectionQueryConfig
    | ValueOrValueResolver<ICollectionQueryConfig>;
}
export interface IQueryOptions<T = any> {
  limit?: number;
  skip?: number;
  sort?:
    | Array<[string, number]>
    | {
        [key in keyof T]?: number | boolean;
      }
    | { [key: string]: number | boolean };
}

export interface ICollectionQueryConfig<T = any> {
  filters?: T extends null ? any : FilterQuery<T>;
  options?: IQueryOptions<T>;
  pipeline?: any[];
}

/**
 * @deprecated The naming was meaningless. Please use ICollectionQueryConfig
 */
export interface IParameterableObject extends ICollectionQueryConfig {}

// The separation between body and sub body is the fact body doesn't have functionable $()
type BodyCustomise<T = null> = {
  $?: ICollectionQueryConfig<T>;
};

type SubBodyCustomise<T = null> = {
  $?: ValueOrValueResolver<ICollectionQueryConfig<T>>;
  $alias?: string;
};

type SimpleFieldValue =
  | 1
  | number
  | boolean
  // This is the part where a reducer is involved and we pass params to it
  | {
      $: {
        [key: string]: any;
      };
    }
  // This is a type of projection operator
  | {
      $filter: any;
    };
// Nested field specification
// | {
//     [key: string]: SimpleFieldValue;
//   };

type Unpacked<T> = T extends (infer U)[] ? U : T;

export type AnyBody = {
  [key: string]:
    | SimpleFieldValue
    | ValueOrValueResolver<ICollectionQueryConfig>
    | AnyBody;
};

type RootSpecificBody<T> = {
  [K in keyof T]?:
    | SimpleFieldValue
    // We do this because the type might be an array
    | QuerySubBodyType<Unpacked<T[K]>>;
};

export type QueryBodyType<T = null> = BodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

export type QuerySubBodyType<T = null> = SubBodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);
