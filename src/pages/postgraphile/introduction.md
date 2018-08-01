---
layout: page
path: /postgraphile/introduction/
title: PostGraphile Introduction
---

## Introduction

<p class='lead'>
PostGraphile (formerly PostGraphQL) builds a powerful, extensible and
performant GraphQL API from a PostgreSQL schema in seconds; saving you
weeks if not months of development time.
</p>

_If you are new to GraphQL then I recommend you read through the official
introduction to GraphQL [here](https://graphql.org/learn/) before continuing
through the PostGraphile documentation._


If you already use PostgreSQL then you understand the value that a strongly
typed and well defined schema can bring to application development, and GraphQL
is the perfect match for this technology when it comes to making your data
layer accessible to your frontend application developers (or even API
clients!). Why duplicate your authorization and business logic in a custom API
when you can leverage the tried and tested capabilities built into [the worlds
most advanced open source database](https://www.postgresql.org/)?

By combining powerful features such as PostgreSQL's [role-based grant
system](https://www.postgresql.org/docs/9.6/static/user-manag.html) and
[row-level security
policies](https://www.postgresql.org/docs/9.6/static/ddl-rowsecurity.html) with
Graphile-Build's advanced [GraphQL look-ahead](/graphile-build/look-ahead/) and
[plugin expansion](/graphile-build/plugins/) technologies, PostGraphile ensures
your generated schema is secure, performant and extensible.

Some of the features we offer:

- [Great performance](/postgraphile/performance/) - no N+1 query issues
- [Connections](/postgraphile/connections/) for easy pagination and Relay support
- [Auto-discovered relations](/postgraphile/relations/) e.g. `userByAuthorId`
- [Automatic CRUD mutations](/postgraphile/crud-mutations/) e.g. `updatePost`
- [Computed columns](/postgraphile/computed-columns/) allowing easy expansion of your API
- [Custom query procedures](/postgraphile/custom-queries/) enabling arbitrary SQL queries
- [Custom mutation procedures](/postgraphile/custom-mutations/) enabling complex changes to be exposed simply

The easiest way to get started is with the [CLI
interface](/postgraphile/usage-cli/); if you have `npx` installed you can try
it out with:

```
npx postgraphile -c postgres://user:pass@localhost/mydb -a -j
```

(replacing user, pass and mydb with your PostgreSQL username, password and the name of your database)
