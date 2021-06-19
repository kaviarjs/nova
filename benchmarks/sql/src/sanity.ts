import * as expect from "expect";
import { POST_PER_USER, COMMENTS_PER_POST, GROUPS } from "./constants";

export const sanity = {
  "Full Database Dump - Users"(result) {
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(10);

    for (const user of result) {
      expect(user.posts).toHaveLength(POST_PER_USER);
      expect(user.groups).toHaveLength(1);
      expect(typeof user.groups[0].name).toBe("string");
      for (const post of user.posts) {
        expect(post.comments).toHaveLength(COMMENTS_PER_POST);
        for (const comment of post.comments) {
          expect(typeof comment.user.email).toBe("string");
        }
      }
    }
  },
  "Get all posts that belong to users in a specific group"(result) {
    expect(Array.isArray(result)).toBe(true);
    expect(result.length > 0).toBe(true);
    for (const post of result) {
      expect(post.user).toBeTruthy();
      expect(typeof post.user.email === "string").toBe(true);
      expect(post.user.groups.length === 1).toBe(true);
      expect(post.user.groups[0].name).toBe(GROUPS[0]);
    }
  },
} as const;
