import * as mongodb from "mongodb";
import * as _ from "lodash";
import { LINK_STORAGE, LinkCollectionOptions } from "../constants";

export enum LinkStrategy {
  ONE,
  MANY,
}

export default class Linker {
  public mainCollection: mongodb.Collection;
  public linkConfig: LinkCollectionOptions & {
    strategy: LinkStrategy;
  };
  public linkName: string;
  public inversedBy: string;
  private _relatedLinker: Linker;

  /**
   * @param mainCollection
   * @param linkName
   * @param linkConfig
   */
  constructor(
    mainCollection: mongodb.Collection,
    linkName: string,
    linkConfig: LinkCollectionOptions
  ) {
    this.mainCollection = mainCollection;

    this.linkConfig = {
      ...linkConfig,
      strategy: linkConfig.many ? LinkStrategy.MANY : LinkStrategy.ONE,
    };

    this.linkName = linkName;

    // check linkName must not exist in schema
    this._validateAndClean();

    if (!this.isVirtual()) {
      this.initIndex();
    }
  }

  get relatedLinker(): Linker {
    if (!this._relatedLinker) {
      const targetCollection = this.linkConfig.collection();
      const linkStorage = targetCollection[LINK_STORAGE];

      if (this.isVirtual()) {
        const { inversedBy } = this.linkConfig;
        const relatedLinker = linkStorage[inversedBy];

        if (!relatedLinker) {
          throw new Error(
            `It seems that you have setup an inversed ${inversedBy} link without declaring the main link`
          );
        }

        this._relatedLinker = relatedLinker;
      }
    }

    return this._relatedLinker;
  }

  /**
   * Returns the strategies: one, many, one-meta, many-meta
   * @returns {string}
   */
  get strategy() {
    return this.linkConfig.many ? LinkStrategy.MANY : LinkStrategy.ONE;
  }

  /**
   * Returns the field name in the document where the actual relationships are stored.
   * @returns string
   */
  get linkStorageField() {
    if (this.isVirtual()) {
      return this.relatedLinker.linkStorageField;
    }

    return this.linkConfig.field;
  }

  /**
   * Returns the collection towards which the link is made
   */
  public getLinkedCollection() {
    return this.linkConfig.collection();
  }

  /**
   * If the relationship for this link is of "many" type.
   */
  public isMany() {
    if (this.isVirtual()) {
      return this.relatedLinker.isMany();
    }

    return Boolean(this.linkConfig.many);
  }

  /**
   * @returns {boolean}
   */
  public isSingle() {
    if (this.isVirtual()) {
      return this.relatedLinker.isSingle();
    }

    return !this.isMany();
  }

  /**
   * @returns {boolean}
   */
  public isVirtual() {
    return Boolean(this.linkConfig.inversedBy);
  }

  /**
   * Should return a single result.
   */
  public isOneResult() {
    return (
      (this.isVirtual() && this.relatedLinker.linkConfig.unique) ||
      (!this.isVirtual() && this.isSingle())
    );
  }

  /**
   * @returns {*}
   * @private
   */
  private _validateAndClean() {
    if (!this.linkConfig.collection) {
      throw new Error(
        `For the link ${this.linkName} you did not provide a collection.`
      );
    }

    if (this.linkConfig.field == this.linkName) {
      throw new Error(
        `For the link ${this.linkName} you must not use the same name for the field, otherwise it will cause conflicts when fetching data`
      );
    }
  }

  private async initIndex() {
    const field: string = this.linkConfig.field;

    if (this.linkConfig.index) {
      if (this.isVirtual()) {
        throw new Error("You cannot set index on an inversed link.");
      }

      let options;
      if (this.linkConfig.unique && this.isSingle()) {
        options = { unique: true };
      }

      if (!this.mainCollection.indexExists(field)) {
        this.mainCollection.createIndex({ [field]: 1 }, options);
      }
    }
  }
}
