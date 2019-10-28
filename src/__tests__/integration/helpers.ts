import { client } from "../connection";
import { Collection } from "mongodb";
import { addLinks } from "../../core/api";

function generateRandomId() {
  return Math.random().toString();
}

export async function log(dataSet) {
  console.log(JSON.stringify(dataSet, null, 4));
}

export async function getRandomCollection(name = "Model"): Promise<Collection> {
  const collName = `${name}${generateRandomId()}`;

  return await client.db("test").createCollection(collName);
}
