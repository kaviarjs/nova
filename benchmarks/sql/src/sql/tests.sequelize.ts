import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@kaviar/nova";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
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
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      const result = await db.Comment.findAll({
        // text: 1,
        // user: {
        //   email: 1,
        //   groups: {
        //     name: 1,
        //   },
        // },
        // post: {
        //   category: {
        //     name: 1,
        //   },
        //   tags: {
        //     name: 1,
        //   },
        //   title: 1,
        //   user: {
        //     email: 1,
        //   },
        // },
        attributes: ["text"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["email"],
            include: [
              {
                model: db.Group,
                as: "groups",
                attributes: ["name"],
              },
            ],
          },
          {
            attributes: ["title"],
            model: db.Post,
            as: "post",
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
                model: db.User,
                as: "user",
                attributes: ["email"],
              },
            ],
          },
        ],
      });

      return result;
    },
  },
  {
    only: true,
    name: "Get all posts that belong to users in a specific group",
    async run() {
      const result = await db.Post.findAll({
        attributes: ["title"],
        where: {},
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
            model: db.User,
            as: "user",
            attributes: ["email"],
            required: true,
            include: [
              {
                model: db.Group,
                as: "groups",
                attributes: ["name"],
                where: {
                  name: GROUPS[0],
                },
                required: true,
              },
            ],
          },
        ],
      });

      return result;
    },
  },
];
