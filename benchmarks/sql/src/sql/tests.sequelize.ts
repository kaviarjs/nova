import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@kaviar/nova";
import { ITestSuite } from "../common";

export const suites: ITestSuite[] = [
  {
    name: "Users Query",
    async run() {
      const result = await db.User.findAll({
        attributes: ["email"],
        include: [
          {
            model: db.Group,
            as: "groups",
            attributes: ["name"],
          },
          {
            attributes: ["title"],
            model: db.Post,
            as: "posts",
            include: [
              {
                model: db.Tag,
                as: "tags",
                attributes: ["name"],
              },
              {
                model: db.PostCategory,
                as: "postCategory",
                attributes: ["name"],
              },
              {
                model: db.Comment,
                attributes: ["text"],
                as: "comments",
                include: [
                  {
                    attributes: ["email"],
                    model: db.User,
                    as: "user",
                  },
                ],
              },
            ],
          },
        ],
      });

      return result;

      // const result = await queryBuilder
      //   .join("posts", "posts.userId", "=", "users.id")
      //   .join("comments", "comments.postId", "=", "posts.userId")
      //   .join(
      //     { commentsUsers: "users" },
      //     "comments.userId",
      //     "=",
      //     "commentsUsers.id"
      //   )
      //   .select([
      //     "users.email",
      //     "posts.title",
      //     "comments.text",
      //     "commentsUsers.email as commentUserEmail",
      //   ])
      //   .from("users");
      // const query = queryBuilder.select(["users.email"]).from("users");

      // const result = await query;

      // console.log(result.length);
      // console.log(JSON.stringify(result, null, 4));
      // console.log(query.toSQL());
    },
  },
];
