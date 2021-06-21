import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@kaviar/nova";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
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
  {
    name: "Users with groups",
    async run() {
      const result = await queryBuilder
        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        .select(["users.email", "groups.name"])
        .from("users");

      // // const query = queryBuilder.select(["users.email"]).from("users");

      return result;
    },
  },
  {
    name: "Posts with tags, comments and comment users email",
    async run() {
      const result = await queryBuilder
        .join("comments", "comments.postId", "=", "posts.id")
        .join("users", "comments.userId", "=", "users.id")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .select([
          "posts.title",
          "tags.name as postTagName",
          "users.email as commentUserEmail",
        ])
        .from("posts");

      return result;
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      const result = await queryBuilder
        .join("posts", "comments.postId", "=", "posts.id")
        .join("users", "comments.userId", "=", "users.id")
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

        .select([
          "comments.text",
          "posts.title",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "groups.name as userGroupName",
          "users.email as commentUserEmail",
        ])
        .from("comments");

      return result;
    },
  },

  {
    name: "Get all posts that belong to users in a specific group",
    async run() {
      const result = await queryBuilder
        .join("users", "posts.userId", "=", "users.id")
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

        .where("groups.name", "=", GROUPS[0])

        .select([
          "posts.title",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "users.email as postUserEmail",
          "groups.name as userGroupName",
        ])
        .from("posts");

      return result;
    },
  },
  {
    name: "Get all posts sorted by category name",
    async run() {
      const result = await queryBuilder
        .join("users", "posts.userId", "=", "users.id")
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

        .where("groups.name", "=", GROUPS[0])

        .select([
          "posts.title",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "users.email as postUserEmail",
          "groups.name as userGroupName",
        ])
        .orderBy("postCategories.name")
        .from("posts");

      return result;
    },
  },
];
