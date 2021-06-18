import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@kaviar/nova";
import { ITestSuite } from "../common";

export const suites: ITestSuite[] = [
  {
    name: "Users Query",
    async run() {
      const result = await queryBuilder
        .join("posts", "posts.userId", "=", "users.id")
        .join(
          "postCategories",
          "posts.postCategoryId",
          "=",
          "postCategories.id"
        )

        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .join("comments", "comments.postId", "=", "posts.userId")
        .join(
          { commentsUsers: "users" },
          "comments.userId",
          "=",
          "commentsUsers.id"
        )
        .select([
          "users.email",
          "posts.title",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "groups.name as userGroupName",
          "comments.text",
          "commentsUsers.email as commentUserEmail",
        ])
        .from("users");

      // // const query = queryBuilder.select(["users.email"]).from("users");

      return result;
      // JSON.stringify(result, null, 4);

      // console.log(result.length);
      // console.log(JSON.stringify(result, null, 4));
      // console.log(query.toSQL());
    },
  },
];
