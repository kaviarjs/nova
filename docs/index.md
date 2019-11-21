# Nova Documentation

You need only 15 minutes to master Nova. Promise! It's designed to be easy.

#### Linking & Querying

Collections are linked through `addLinks()`, collections are instances of `mongodb.Collection`

```typescript
// mongoose
Model.collection;

// Meteor
Collection.rawCollection();
```

```typescript
import { addLinks } from "@kaviar/nova";

addLinks(Patients, {
  medicalProfile: {
    collection: () => MedicalProfiles,
    field: 'medicalProfileId'
    many?: false, // defaults to false
  }
})
```

This would allow us to run the following query:

```typescript
import { query } from "@kaviar/nova";

const results = await query(Patients, {
  name: 1,
  someField: 1,
  someNestedField: {
    someValue: 1,
  }
  // This is the link
  medicalProfile: {
    bloodPresure: 1,
  }
}).fetch();
// You can also run .fetchOne() if you expect a single result
```

When we talk about inversed links, we mean that we want to query `MedicalProfiles` and go to `Patients`, to do that we have to setup an inversed link:

```typescript
addLinks(MedicalProfiles, {
  patient: {
    collection: () => Patients,
    inversedBy: "medicalProfile" // The actual link name
  }
});
```

Then it's easy:

```typescript
import { query } from "@kaviar/nova";

const medicalProfile = await query(MedicalProfiles, {
  patient: {
    name: 1
  }
}).fetchOne();
```

However, this time you will notice that `medicalProfile.patient` is actually an array. And that's because it doesn't know it's unique, because this strategy can also be applied to having many, solution is to add `unique: true` when defining the `medicalProfile` link inside `Patients` collection.

> Links can go at any nesting level you wish.

If you want to filter the data we introduce the special `$` field:

```typescript
query(Posts, {
  $: {
    filters: {
      isPublished: true
    },
    options: {
      sort: {
        createdAt: -1,
      },
      limit: 100,
      skip: 0,
    }
  }
  comments: {
    $: {
      filters: {
        isApproved: true
      },
    }
  }
})
```

Using `options.sort`, `options.limit` and `options.skip` inside nested collections may have performance impact, and it is explained why in the [Limitations](./limitations.md) section.

#### Linking Shortcuts

```typescript
// The link is stored in the first mentioned collection
import { oneToOne, manyToOne, manyToMany } from "@kaviar/nova";

manyToOne(Comments, Post, {
  linkName: "post",
  inversedLinkName: "comments"
  // field will be `postId`
});

oneToOne(Users, GameProfile, {
  linkName: "gameProfile",
  inversedLinkName: "user"
  // field will be `gameProfileId`
});

oneToMany(Posts, PostWarnings, {
  linkName: "postWarnings",
  inversedLinkName: "post" // single
  // field will be `postWarningsIds`
});

manyToMany(Posts, Tags, {
  linkName: "tags",
  inversedLinkName: "posts"
  // field will be `tagsIds`
});
```

You can also specify a custom `field` as a final option.

#### Reducers

Reducers are a way to expand the request query and compute the values, then get you a cleaned version. Imagine them as virtual, on-demand computed query fields:

```typescript
import { addReducers } from "@kaviar/nova";

addReducers(Users, {
  fullName: {
    dependency: {
      // Here we define what it needs to resolve
      // Yes, you can specify here links, fields, nested fields, and other reducers as well
      profile: {
        firstName: 1,
        lastName: 1
      }
    },
    // Reducers can also work with parameters
    async reduce(obj, params) {
      let fullName = `${obj.profile.firstName} ${obj.profile.lastName}`;
      if (params.withPrefix) {
        fullName = `Mr ${fullName}`;
      }

      return fullName;
    }
  }
});
```

```typescript
query(Users, {
  fullName: 1
});

query(Users, {
  fullName: {
    // Or with params
    $: {
      withPrefix: true
    }
  }
});
```

Fields can end with `1` or as an empty object: `{}` it makes no difference, however, you are not allowed to use dotted fields, so instead of `profile.name: 1` use `profile: { name: 1 }`.

Reducers can use other links and other reducers.

#### GraphQL Bridge

```typescript
// Define your query resolvers
const Query = {
  users(_, args, context, info) {
    return query
      .graphql(A, info, {
        // You can pass top level filters and options
        $: {
          filters: {},
          options: {}
        },

        // Manipulate the transformed body
        // Here, you would be able to remove certain fields, or manipulate the Nova Query body
        // This happens before creating the nodes, so it gives you a chance to do whatever you wish
        embody(body) {
          // Do whatever you wish to the body.
        },

        // Intersection is what they have in common, you can specify here a query-like Body
        // Intersection runs before embodyment and you have to specify `$: 1` in the body if you want parameterable queries

        intersect: {},

        // Useful when you don't have an intersection body, to restrict the limit of depth, to avoid a nested GraphQL attack
        maxDepth: 10,

        // Automatically enforces a maximum number of results
        maxLimit: 10,

        // Simply removes from the graph what fields it won't allow
        // Can work with deep strings like 'comments.author'
        // This is sugary syntax of intersection
        deny // String[]
      })
      .fetch();
  }
};
```

### Expanders

Expanders are designed to work very well with GraphQL Resolvers, so they can resolve and use only the data needed, avoiding over-fetching.

```js
import { addExpanders } from "@kaviar/nova";

addExpanders(Users, {
  // Full name will not appear in the result set
  fullName: {
    profile: {
      firstName: 1,
      lastName: 1
    }
  }
});

query(Users, {
  fullName: 1
}).fetchOne();
// { profile: { firstName, lastName }}
```
