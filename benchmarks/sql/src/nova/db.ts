import { addLinks } from "@kaviar/nova";
import { Collection, MongoClient } from "mongodb";
// Connection URI
const DB = "nova";
const MONGO_URI = `mongodb://18.156.171.158:25000/${DB}`;
// const MONGO_URI = `mongodb://localhost:27017/${DB}`;

// Create a new MongoClient
const client = new MongoClient(MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

export const db: {
  Users: Collection;
  Tags: Collection;
  Posts: Collection;
  PostsCategories: Collection;
  Comments: Collection;
  Groups: Collection;
} = {
  Users: null,
  Tags: null,
  Posts: null,
  PostsCategories: null,
  Comments: null,
  Groups: null,
};

export async function setup() {
  await client.connect();
  const clientDb = client.db(DB);

  db.Users = await clientDb.collection("users");
  db.Tags = await clientDb.collection("tags");
  db.Posts = await clientDb.collection("posts");
  db.PostsCategories = await clientDb.collection("postCategories");
  db.Comments = await clientDb.collection("comments");
  db.Groups = await clientDb.collection("groups");

  addLinks(db.Users, {
    groups: {
      field: "groupsIds",
      collection: () => db.Groups,
      many: true,
    },
    posts: {
      collection: () => db.Posts,
      inversedBy: "user",
    },
    comments: {
      collection: () => db.Comments,
      inversedBy: "user",
    },
  });

  addLinks(db.Groups, {
    users: {
      collection: () => db.Users,
      inversedBy: "groups",
    },
  });

  addLinks(db.Posts, {
    tags: {
      field: "tagsIds",
      collection: () => db.Tags,
      many: true,
    },
    category: {
      field: "categoryId",
      collection: () => db.PostsCategories,
    },
    comments: {
      collection: () => db.Comments,
      inversedBy: "post",
    },
    user: {
      collection: () => db.Users,
      field: "userId",
    },
  });

  addLinks(db.PostsCategories, {
    posts: {
      collection: () => db.Posts,
      inversedBy: "category",
    },
  });

  addLinks(db.Comments, {
    post: {
      collection: () => db.Posts,
      field: "postId",
    },
    user: {
      collection: () => db.Users,
      field: "userId",
    },
  });

  addLinks(db.Tags, {
    posts: {
      collection: () => db.Posts,
      inversedBy: "tags",
    },
  });
}
