# Limitations

## It's no SQL

SQL still remains KING in certain scenarios.

We still don't have the ability to perform what SQL can do, things like I want to get all the users in which the company (which is stored in other collection) has a specific name.

To do that, you may want to first query for companies matching your criteria, then query-ing the users belonging to those companies.

## Limit/Skip in the nested collections

Let's take this post for example, we want to find all posts, then we want the latest 5 comments from each.

Currently, we store `postId` inside the comments collection:

```js
query(Posts, {
  comments: {
    $: {
      options: {
        sort: { createdAt: -1 },
        limit: 5
      }
      author: {
        name: 1,
      }
    }
    name: 1,
  }
}
```

Hypernova is not able to retrieve all comments for all posts in one-go (because of limit/skip). Therefore it has to do it iteratively for each found post. However, hypernova works afterwards when we need to fetch the authors of comments. It will fetch all authors in one-go, and properly assemble it.

## Top-level fields for linking information

We allow storing link storages within nested objects such as:

```typescript
{
  profile: {
    paymentProfileId: []; // <- Like this
  }
}
```

```typescript
addLinks(Users, {
  collection: () => PaymentProfiles,
  field: "profile.paymentProfileId",
});
```

However, we currently can't work with fields in arrays of objects, or have array of objects connect to certain collections:

```js
// NOT POSSIBLE to link with a schema as such:
{
  users: [
    {userId: 'xxx', roles: 'ADMIN'},
    ...
  ]
}
```
