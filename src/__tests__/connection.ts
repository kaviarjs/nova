import * as mongodb from "mongodb";
import { enhance } from "../core/api";

export const client = new mongodb.MongoClient("mongodb://localhost:27017/test");
