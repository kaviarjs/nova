import { CollectionQueryBody } from "../../constants";

export interface INode {
  name: string;
  parent?: INode;
}
