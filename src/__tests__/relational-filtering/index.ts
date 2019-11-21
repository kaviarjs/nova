import { query, clear, lookup } from "../../core/api";
import { getRandomCollection } from "../integration/helpers";
import { Collection } from "mongodb";
import { oneToMany, manyToMany } from "../../core/utils";
import { assert } from "chai";

describe("Relational Filtering", () => {
  let A: Collection;
  let B: Collection;
  let C: Collection;
  let D: Collection;
  let E: Collection;

  before(async () => {
    A = await getRandomCollection("A");
    B = await getRandomCollection("B");
    C = await getRandomCollection("C");
    D = await getRandomCollection("D");
    E = await getRandomCollection("E");
  });

  // Cleans the collection and their defined links
  afterEach(async () => {
    await A.deleteMany({});
    await B.deleteMany({});
    await C.deleteMany({});
    await D.deleteMany({});
    await E.deleteMany({});

    [A, B, C, D, E].forEach(coll => clear(coll));
  });

  it("1:M:D - Simple filtering of nested collection", async () => {
    // A has many B.
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as"
    });

    const b1 = await B.insertOne({ name: "B1", number: 5 });
    const b2 = await B.insertOne({ name: "B2", number: 10 });
    const b3 = await B.insertOne({ name: "B3", number: 50 });

    const a1 = await A.insertOne({
      name: "A1",
      bsIds: [b1.insertedId, b2.insertedId]
    });

    const a2 = await A.insertOne({
      name: "A2",
      bsIds: [b2.insertedId, b3.insertedId]
    });

    const a3 = await A.insertOne({
      name: "A3",
      bsIds: [b1.insertedId]
    });

    // We are looking for A's which have exactly 2 B's
    const result = await query(A, {
      $: {
        pipeline: [
          lookup(A, "bs"),
          {
            $match: {
              bs: {
                $size: 2
              }
            }
          }
        ]
      },
      _id: 1,
      bs: {
        _id: 1
      },
      bsCount: 1
    }).fetch();

    assert.lengthOf(result, 2);

    // Now I want to get all bs who have at least 2 A's
    const result2 = await query(B, {
      $: {
        pipeline: [
          lookup(B, "as"),
          {
            $match: {
              as: {
                $size: 2
              }
            }
          }
        ]
      },
      _id: 1,
      as: {
        _id: 1
      }
    }).fetch();

    assert.lengthOf(result2, 2);
  });
});
