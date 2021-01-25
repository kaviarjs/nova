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
  intersect?: QueryBodyType;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  filters?: any;
  options?: any;
  embody?(body: QueryBodyType, getArguments: (path: string) => any);
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
  dependency: QueryBodyType;
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
  [key: string]: QueryBodyType;
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
}

export interface IPost {
  title: string;
  age: number;
}

export interface IPost {
  title: string;
  age: number;
  user: IUser;
}

export interface IUser {
  name: string;
  comments: IComment[];
}

export interface IComment {
  user: IUser;
  title: string;
}

// The separation between body and sub body is the fact body doesn't have functionable $()
export type BodyCustomise<T = any> = {
  $?: IParamaterableObject;
};

export type SubBodyCustomise<T = any> = {
  $?: Functionable<IParamaterableObject>;
  $alias?: string;
};

export type FieldSpecificity =
  | 1
  | number
  | boolean
  // This is the part where a reducer is involved
  | {
      $: {
        [key: string]: any;
      };
    }
  // This is a type of project
  | {
      $filter: any;
    };

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type AnyBody = SubBodyCustomise & {
  [key: string]:
    | FieldSpecificity
    | AnyBody
    | Functionable<IParamaterableObject>;
};

export type RootSpecificBody<T> = {
  [K in keyof T]?:
    | FieldSpecificity
    // We do this because the type might be an array
    | QuerySubBodyType<T[K] extends Array<any> ? Unpacked<T[K]> : T[K]>;
};

export type QueryBodyType<T = null> = BodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

export type QuerySubBodyType<T = any> = SubBodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

const body: QueryBodyType<any> = {};
