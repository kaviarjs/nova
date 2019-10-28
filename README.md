# Nova

[![Build Status](https://api.travis-ci.org/kaviarjs/db.svg?branch=master)](https://travis-ci.org/kaviarjs/nova)

[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

_Nova_ is the fetching layer on top of MongoDB Node Driver, which allows SQL-comparable speeds for retrieving relational data. [Read the full story here](./docs/story.md)

GraphQL is treated as a first-class citizen, by offering ability to transform the GraphQL query into Nova query. **You do not have to use GraphQL to use this library**

The incredible speed boost is possible thanks to the technology called `database hypernova`, created by [Theodor Diaconu](https://www.linkedin.com/in/dtheodor/) in 2016 for Meteor. Read more about the [Hypernova](./docs/hypernova.md).

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

## GraphQL

```js
import { query } from "@kaviar/nova";

const Query = {
  // Automatically fetches everything in the minimum amount of queries
  users(_, args, ctx, info) {
    return query.graphql(Posts, info).fetch();
  },
};
```

### Quick Illustration

Query:

```js
query(Posts, {
  title: 1,
  author: {
    fullName: 1,
  },
  comments: {
    text: 1,
    createdAt: 1,
    author: {
      fullName: 1,
    },
  },
  categories: {
    name: 1,
  },
}).fetch();
```

Result:

```js
[
  {
    _id: 'postId',
    title: 'Introducing Nova',
    author: {
      _id: 'authorId',
      fullName: 'John Smith',
    },
    comments: [
      {
        _id: 'commentId',
        text: 'Nice article!,
        createdAt: Date,
        author: {
            fullName: 1
        }
      }
    ],
    categories: [ {_id: 'categoryId', name: 'JavaScript'} ],
  }
]
```
