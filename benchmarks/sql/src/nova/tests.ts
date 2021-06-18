import { db } from "./db";
import { query } from "@kaviar/nova";
import * as Benchmark from "benchmark";
import { ITestSuite } from "../common";

export const suites: ITestSuite[] = [
  {
    name: "Users Query",
    async run() {
      return await query(db.Users, {
        email: 1,
        groups: {
          name: 1,
        },
        posts: {
          category: {
            name: 1,
          },
          tags: {
            name: 1,
          },
          title: 1,
          comments: {
            text: 1,
            user: {
              email: 1,
            },
          },
        },
      }).toArray();
    },
  },
];
