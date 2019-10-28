# Nova

[![Build Status](https://api.travis-ci.org/kaviarjs/nova.svg?branch=master)](https://travis-ci.org/kaviarjs/nova)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

_Nova_ is the fetching layer on top of MongoDB Node Driver, which allows SQL-comparable speeds for retrieving relational data. [Read it's history here](./docs/story.md)

GraphQL is treated as a first-class citizen, by offering ability to transform the GraphQL query into a Nova query. **You do not have to use GraphQL to use this library**

The incredible speed boost is possible thanks to the technology called `database hypernova`, created by [Theodor Diaconu](https://www.linkedin.com/in/dtheodor/) in 2016 for Meteor. Read more about the [Hypernova](./docs/hypernova.md).

## What it solves

- It makes it bearable to use MongoDB as a relational database
- Speeds surpassing SQL in various scenarios.
- Works with GraphQL to avoid over-fetching

## Installation

```
npm i -S @kaviar/nova
```

## [Documentation](docs/index.md)

This provides a learning curve for **Nova** and it explains all the features.

## Sample

```js
import { query, addLinks } from "@kaviar/nova";

async function test() {
  const Post = await db.createCollection("Post");
  const Comments = await db.createCollection("Comments");

  oneToMany(Comments, Post, {
    linkName: "post",
    inversedLinkName: "comments",
  }); // also available manyToMany and manyToOne

  query(Post, {
      $: {
          filters: {
              isApproved: true
          }
      }
      title: 1,
      comments: {
          name: 1
      }
  })
}
```

## [GraphQL](./docs/index.md)

```js
import { query } from "@kaviar/nova";

const Query = {
  // Automatically fetches everything in the minimum amount of queries
  users(_, args, ctx, info) {
    // It passes arguments automatically
    return query.graphql(Posts, info).fetch();
  },
};
```
