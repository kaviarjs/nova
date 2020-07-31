import { IQueryBody } from "../../defs";

export interface INode {
  name: string;
  parent?: INode;
}
