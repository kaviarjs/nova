import * as expect from "expect";
import { POST_PER_USER, COMMENTS_PER_POST } from "./constants";

export const sanity = {
  "Users Query"(result) {
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
} as const;
