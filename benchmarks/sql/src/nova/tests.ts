import { db } from "./db";
import { query } from "@kaviar/nova";
import * as Benchmark from "benchmark";
import { ITestSuite } from "../common";

export const suites: ITestSuite[] = [
  {
    name: "Users Query",
    async run() {
      await query(db.Users, {
        email: 1,
        posts: {
          title: 1,
          comments: {
            text: 1,
          },
        },
      }).toArray();
    },
  },
];
