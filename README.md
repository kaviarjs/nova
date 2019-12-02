# Nova

[![Build Status](https://api.travis-ci.org/kaviarjs/nova.svg?branch=master)](https://travis-ci.org/kaviarjs/nova)
[![Coverage Status](https://coveralls.io/repos/github/kaviarjs/nova/badge.svg?branch=master)](https://coveralls.io/github/kaviarjs/nova?branch=master)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

_Nova_ is the fetching layer on top of MongoDB Node Driver, which allows SQL-comparable speeds for retrieving relational data.

GraphQL is treated as a first-class citizen, by offering ability to transform the GraphQL query into a Nova query. **You do not have to use GraphQL to use this library**

The incredible speed boost is possible thanks to the technology called Hypernova, you can read more about it [inside the documentation](./docs/index.md#hypernova).

## What does it solve?

- It makes it a joy to use MongoDB as a relational database
- Support for relational filtering & sorting
- Speeds surpassing SQL in various scenarios
- Lower bandwidth used than SQL for joined documents
- Works with the default MongoDB Node Drivers
- Super light-weight integration for GraphQL

## Installation

```
npm i -S @kaviar/nova
```

## [Documentation](docs/index.md)

### [Table of Contents](docs/index.md)

- [Linking collections](docs/index.md#linking-collections)
- [Query-ing](docs/index.md#query-ing)
- [Relational Filtering and Sorting](docs/index.md#relational-filtering-and-sorting)
- [Dynamic Filters](docs/index.md#dynamic-filters)
- [Reducers](docs/index.md#reducers)
- [Aliased Collections](docs/index.md#aliased-collections)
- [GraphQL Integration](docs/index.md#graphql-integration)
- [Limitations](docs/index.md#limitations)
- [Hypernova](docs/index.md#hypernova)

## Sample

```js
import { query, manyToOne } from "@kaviar/nova";

async function test() {
  const Post = await db.createCollection("Post");
  const Comments = await db.createCollection("Comments");

  manyToOne(Comments, Post, {
    // will automatically read from postId inside Comments
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

## [GraphQL](./docs/index.md#graphql-integration)

```js
import { query } from "@kaviar/nova";

const Query = {
  // Automatically fetches everything in the minimum amount of queries
  users(_, args, ctx, info) {
    return query.graphql(Posts, info).fetch();
  }
};
```
