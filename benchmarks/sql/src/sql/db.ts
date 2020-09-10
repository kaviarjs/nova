import { Sequelize, DataTypes } from "sequelize";

export const sequelize = new Sequelize("novaBenchmarks", "root", null, {
  dialect: "mysql",
  logging: false,
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
Group.belongsToMany(User, { as: "Users", through: "UserGroup" });
User.belongsToMany(Group, { as: "Groups", through: "UserGroup" });

// Tag & Post
Tag.belongsToMany(Post, { through: "PostTag" });
Post.belongsToMany(Tag, { through: "PostTag" });

// Post & PostCategory
PostCategory.hasMany(Post, { as: "Posts" });
Post.belongsTo(PostCategory);

Post.hasMany(Comment, { as: "comments" });
Comment.belongsTo(Post);

// Post & User
User.hasMany(Post, { as: "posts" });
Post.belongsTo(User);

// Comment & User
Comment.belongsTo(User);
User.hasMany(Comment, { as: "comments" });
