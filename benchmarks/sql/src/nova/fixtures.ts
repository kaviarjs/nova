import {
  RUN_FIXTURES,
  TAGS,
  GROUPS,
  POST_CATEGORIES,
  POST_PER_USER,
  COMMENTS_PER_POST,
  COMMENT_TEXT_SAMPLES,
  USERS_COUNT,
} from "../constants";
import { db } from "./db";
import { createRandomUser, createRandomPost } from "../common";
import { Collection } from "mongodb";

export async function getNextId(collection: Collection): Promise<number> {
  const result = (await collection.find().count()) + 1;
  return result;
}

export async function runFixtures() {
  for (const collKey in db) {
    console.log(`Deleting all documents from: "${collKey}"`);
    await db[collKey].removeMany({});
  }

  console.log("[ok] now started to load fixtures, patience padawan!");

  const tags = [];
  for (const name of TAGS) {
    const result = await db.Tags.insertOne({
      _id: await getNextId(db.Tags),
      name,
    });
    tags.push(await db.Tags.findOne({ _id: result.insertedId }));
  }

  const groups = [];
  for (const name of GROUPS) {
    const result = await db.Groups.insertOne({
      _id: await getNextId(db.Groups),
      name,
    });
    groups.push(await db.Groups.findOne({ _id: result.insertedId }));
  }

  const categories = [];
  for (const name of POST_CATEGORIES) {
    const result = await db.PostsCategories.insertOne({
      _id: await getNextId(db.PostsCategories),
      name,
    });
    categories.push(
      await db.PostsCategories.findOne({ _id: result.insertedId })
    );
  }

  let users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const user = await db.Users.insertOne({
      ...createRandomUser(),
      groupsIds: [groups[i % groups.length]._id],
      _id: await getNextId(db.Users),
    });
    users.push(await db.Users.findOne({ _id: user.insertedId }));
  }

  console.log("Completed users");

  for (const user of users) {
    console.log("Handling user:", user);
    for (let postIndex = 0; postIndex < POST_PER_USER; postIndex++) {
      const post = createRandomPost(postIndex);
      const result = await db.Posts.insertOne({
        ...post,
        userId: user._id,
        categoryId: categories[postIndex % categories.length]._id,
        tagsIds: [tags[postIndex % tags.length]._id],
        _id: await getNextId(db.Posts),
      });

      // CREATE COMMENTS FOR EACH POST
      for (
        let commentIndex = 0;
        commentIndex < COMMENTS_PER_POST;
        commentIndex++
      ) {
        await db.Comments.insertOne({
          _id: await getNextId(db.Comments),
          postId: result.insertedId,
          userId: users[commentIndex % users.length]._id,
          text: "Hello Hello Hello Hello Hello",
        });
      }
    }
  }

  console.log("[ok] fixtures have been loaded.");
}
