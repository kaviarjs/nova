import {
  FORCE_FIXTURES,
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

export async function runFixtures() {
  // if ((await db.Users.find().count()) > 0) {
  //   return;
  // }

  for (const collKey in db) {
    console.log(`Clearing up: "${collKey}"`);
    await db[collKey].removeMany({});
  }

  console.log("[ok] now started to load fixtures, patience padawan!");

  const tags = [];
  for (const name of TAGS) {
    const result = await db.Tags.insertOne({ name });
    tags.push(await db.Tags.findOne(result.insertedId));
  }

  const groups = [];
  for (const name of GROUPS) {
    const result = await db.Groups.insertOne({ name });
    groups.push(await db.Groups.findOne(result.insertedId));
  }

  const categories = [];
  for (const name of POST_CATEGORIES) {
    const result = await db.PostsCategories.insertOne({ name });
    categories.push(await db.PostsCategories.findOne(result.insertedId));
  }

  let users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const user = await db.Users.insertOne({
      ...createRandomUser(),
      groupsIds: groups[i % groups.length]._id,
    });
    users.push(await db.Users.findOne(user.insertedId));
  }

  for (const user of users) {
    for (let postIndex = 0; postIndex < POST_PER_USER; postIndex++) {
      const post = createRandomPost(postIndex);
      const result = await db.Posts.insertOne({
        ...post,
        userId: user._id,
        categoryId: categories[postIndex % categories.length]._id,
        tagsIds: [tags[postIndex % tags.length]._id],
      });

      // CREATE COMMENTS FOR EACH POST
      for (
        let commentIndex = 0;
        commentIndex < COMMENTS_PER_POST;
        commentIndex++
      ) {
        await db.Comments.insertOne({
          postId: result.insertedId,
          userId: users[commentIndex % users.length]._id,
          text: "Hello Hello Hello Hello Hello",
        });
      }
    }
  }

  console.log("[ok] fixtures have been loaded.");
}
