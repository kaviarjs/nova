import { Sequelize, DataTypes } from "sequelize";
import * as knex from "knex";

export const sequelize = new Sequelize("postgres", null, null, {
  dialect: "postgres",
  logging: false,
});

export const queryBuilder = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: null,
    password: null,
    database: "postgres",
  },
});

export const User = sequelize.define("user", {
  username: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  roles: {
    type: DataTypes.STRING,
  },
});

export const Tag = sequelize.define("tag", {
  name: DataTypes.STRING,
});

export const PostCategory = sequelize.define("postCategory", {
  name: DataTypes.STRING,
});

export const Post = sequelize.define("post", {
  title: DataTypes.STRING,
});

export const Group = sequelize.define("group", {
  name: DataTypes.STRING,
});

export const Comment = sequelize.define("comment", {
  text: DataTypes.STRING,
});

// Define relationships

// User & Group
Group.belongsToMany(User, { as: "users", through: "UserGroup" });
User.belongsToMany(Group, { as: "groups", through: "UserGroup" });

// Tag & Post
Tag.belongsToMany(Post, { through: "PostTag" });
Post.belongsToMany(Tag, { through: "PostTag" });

// Post & PostCategory
PostCategory.hasMany(Post, { as: "posts" });
Post.belongsTo(PostCategory);

Post.hasMany(Comment, { as: "comments" });
Comment.belongsTo(Post);

// Post & User
User.hasMany(Post, { as: "posts" });
Post.belongsTo(User);

// Comment & User
Comment.belongsTo(User);
User.hasMany(Comment, { as: "comments" });
