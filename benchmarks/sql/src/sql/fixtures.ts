import * as db from "./db";
import { v4 as uuid } from "uuid";
import * as _ from "lodash";
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

export async function runFixtures() {
  await db.sequelize.authenticate();
  await db.sequelize.sync();

  const foundUsers = await db.User.findAll();

  if (!FORCE_FIXTURES) {
    if (foundUsers.length) {
      console.log(
        "[ok] we are no longer loading fixtures, we found users, we assume they are loaded"
      );
      return;
    }
  }

  console.log("[ok] now started to load fixtures, patience padawan!");

  let tags = [];
  for (let i in TAGS) {
    const tag = await db.Tag.create({ name: TAGS[i] });
    tags.push(tag);
  }

  let groups = [];

  for (let i in GROUPS) {
    const group = await db.Group.create({ name: GROUPS[i] });
    groups.push(group);
  }

  let categories = [];

  for (let i in POST_CATEGORIES) {
    const category = await db.PostCategory.create({ name: POST_CATEGORIES[i] });
    categories.push(category);
  }

  let users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const user = await db.User.create({
      email: `user-${uuid()}@app.com`,
      password: `12345`,
    });

    users.push(user);
  }

  for (let k = 0; k < users.length; k++) {
    const user = users[k];
    await user.addGroup(_.sample(groups));

    for (let i = 0; i < POST_PER_USER; i++) {
      let post = await db.Post.create({
        title: `User Post - ${i}`,
      });

      /* @ts-ignore */
      await post.setPostCategory(_.sample(categories));
      /* @ts-ignore */
      await post.setUser(user);
      /* @ts-ignore */
      await post.addTag(_.sample(tags));

      for (let j = 0; j < COMMENTS_PER_POST; j++) {
        let comment = await db.Comment.create({
          text: _.sample(COMMENT_TEXT_SAMPLES),
        });

        /* @ts-ignore */
        await comment.setPost(post);
        /* @ts-ignore */
        await comment.setUser(_.sample(users));
      }
    }
  }

  console.log("[ok] fixtures have been loaded.");
}
