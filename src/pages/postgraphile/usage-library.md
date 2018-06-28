---
layout: page
path: /postgraphile/usage-library/
title: PostGraphile as a Library
---

## Using PostGraphile as a Library

Some people may want to use PostGraphile as a dependency of their current
Node.js projects instead of as a CLI tool. If this is the approach you want to
take then you may either use PostGraphile as an HTTP middleware, or create and
execute queries against a PostGraphile schema using your own custom code. In
this article we will go the former, for the latter see [Schema-only
Usage](/postgraphile/usage-schema/).

### HTTP Middleware

To mount a PostGraphile instance on your own web server there is an export
`postgraphile` from the `postgraphile` package that can be used as HTTP
middleware for the following HTTP frameworks:

* [`connect`](http://npmjs.com/connect)
* [`express`](https://www.npmjs.com/package/express)
* [Vanilla `http`](https://nodejs.org/api/http.html)

_We also have alpha-quality support for [`koa`
2.0](https://www.npmjs.com/package/koa), if you notice any problems please raise a GitHub issue about it._

To use PostGraphile with `express`, for instance, just do the following:

```js
const express = require("express");
const { postgraphile } = require("postgraphile");

const app = express();

app.use(postgraphile(process.env.DATABASE_URL || "postgres://localhost/"));

app.listen(process.env.PORT || 3000);
```

Or to use it with the built-in `http` module:

```js
const http = require("http");
const { postgraphile } = require("postgraphile");

http
  .createServer(
    postgraphile(process.env.DATABASE_URL || "postgres://localhost/")
  )
  .listen(process.env.PORT || 3000);
```

#### API: `postgraphile(pgConfig, schemaName, options)`

The `postgraphile` middleware factory function takes three arguments, all of which are optional.

* **`pgConfig`**: An object or string that will be passed to the [`pg`][] library and used to connect to a PostgreSQL backend, OR a pg.Pool to use.
* **`schemaName`**: A string, or array of strings, which specifies the PostgreSQL schema(s) you to expose via PostGraphile; defaults to 'public'
* **`options`**: An object containing other miscellaneous options. Options include: <!-- LIBRARY_DOCBLOCK_BEGIN -->
  * `watchPg`: When true, PostGraphile will watch your database schemas and re-create the GraphQL API whenever your schema changes, notifying you as it does. This feature requires an event trigger to be added to the database by a superuser. When enabled PostGraphile will try to add this trigger, if you did not connect as a superuser you will get a warning and the trigger won’t be added.
  * `pgDefaultRole`: The default Postgres role to use. If no role was provided in a provided JWT token, this role will be used.
  * `dynamicJson`: Setting this to `true` enables dynamic JSON which will allow you to use any JSON as input and get any arbitrary JSON as output. By default JSON types are just a JSON string.
  * `setofFunctionsContainNulls`: If none of your `RETURNS SETOF compound_type` functions mix NULLs with the results then you may set this true to reduce the nullables in the GraphQL schema
  * `classicIds`: Enables classic ids for Relay support. Instead of using the field name `nodeId` for globally unique ids, PostGraphile will instead use the field name `id` for its globally unique ids. This means that table `id` columns will also get renamed to `rowId`.
  * `disableDefaultMutations`: Setting this to `true` will prevent the creation of the default mutation types & fields. Database mutation will only be possible through Postgres functions.
  * `showErrorStack`: Enables adding a `stack` field to the error response.  Can be either the boolean `true` (which results in a single stack string) or the string `json` (which causes the stack to become an array with elements for each line of the stack).
  * `handleErrors`: Enables ability to modify errors before sending them down to the client optionally can send down custom responses
  * `extendedErrors`: Extends the error response with additional details from the Postgres error.  Can be any combination of `['hint', 'detail', 'errcode']`. Default is `[]`.
  * `appendPlugins`: an array of [Graphile Build](/graphile-build/plugins/) plugins to load after the default plugins
  * `prependPlugins`: an array of [Graphile Build](/graphile-build/plugins/) plugins to load before the default plugins (you probably don't want this)
  * `replaceAllPlugins`: the full array of [Graphile Build](/graphile-build/plugins/) plugins to use for schema generation (you almost definitely don't want this!)
  * `readCache`: A file path string. Reads cached values from local cache file to improve startup time (you may want to do this in production).
  * `writeCache`: A file path string. Writes computed values to local cache file so startup can be faster (do this during the build phase).
  * `exportJsonSchemaPath`: Enables saving the detected schema, in JSON format, to the given location. The directories must exist already, if the file exists it will be overwritten.
  * `exportGqlSchemaPath`: Enables saving the detected schema, in GraphQL schema format, to the given location. The directories must exist already, if the file exists it will be overwritten.
  * `graphqlRoute`: The endpoint the GraphQL executer will listen on. Defaults to `/graphql`.
  * `graphiqlRoute`: The endpoint the GraphiQL query interface will listen on (**NOTE:** GraphiQL will not be enabled unless the `graphiql` option is set to `true`). Defaults to `/graphiql`.
  * `graphiql`: Set this to `true` to enable the GraphiQL interface.
  * `enableCors`: Enables some generous CORS settings for the GraphQL endpoint. There are some costs associated when enabling this, if at all possible try to put your API behind a reverse proxy.
  * `bodySizeLimit`: Set the maximum size of JSON bodies that can be parsed (default 100kB). The size can be given as a human-readable string, such as '200kB' or '5MB' (case insensitive).
  * `enableQueryBatching`: [Experimental] Enable the middleware to process multiple GraphQL queries in one request
  * `jwtSecret`: The secret for your JSON web tokens. This will be used to verify tokens in the `Authorization` header, and signing JWT tokens you return in procedures.
  * `jwtVerifyOptions`: Options with which to perform JWT verification - see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
  * `jwtRole`: A comma separated list of strings that give a path in the jwt from which to extract the postgres role. If none is provided it will use the key `role` on the root of the jwt.
  * `jwtPgTypeIdentifier`: The Postgres type identifier for the compound type which will be signed as a JWT token if ever found as the return type of a procedure. Can be of the form: `my_schema.my_type`. You may use quotes as needed: `"my-special-schema".my_type`.
  * `jwtAudiences`: The audiences to use when verifing the JWT token. If not set the audience will be `['postgraphile']`.
  * `legacyRelations`: Some one-to-one relations were previously detected as one-to-many - should we export 'only' the old relation shapes, both new and old but mark the old ones as 'deprecated', or 'omit' the old relation shapes entirely
  * `legacyJsonUuid`: ONLY use this option if you require the v3 typenames 'Json' and 'Uuid' over 'JSON' and 'UUID'
  * `disableQueryLog`: Turns off GraphQL query logging. By default PostGraphile will log every GraphQL query it processes along with some other information. Set this to `true` to disable that feature.
  * `pgSettings`: A plain object specifying custom config values to set in the PostgreSQL transaction (accessed via `current_setting('my.custom.setting')`) or a function which will return the same (or a Promise to the same) based on the incoming web request (e.g. to extract session data)
  * `additionalGraphQLContextFromRequest`: Some graphile-build plugins may need additional information available on the `context` argument to the resolver - you can use this function to provide such information based on the incoming request - you can even use this to change the response [experimental], e.g. setting cookies
  * `pluginHook`: [experimental] Plugin hook function, enables functionality within PostGraphile to be expanded with plugins. Generate with `makePluginHook(plugins)` passing a list of plugin objects.
  * `simpleCollections`: Should we use relay pagination, or simple collections? "omit" (default) - relay connections only, "only" - simple collections only (no Relay connections), "both" - both

<!-- LIBRARY_DOCBLOCK_END -->

The following options and not part of PostGraphile core, but are available from the Supporter and/or Pro plugins - see [Go Pro!](/postgraphile/pricing/) for more information.

* **`options`**:
  * `simpleSubscriptions`: [SUPPORTER] ⚡️[experimental] set this to `true` to add simple subscription support
  * `subscriptionAuthorizationFunction [fn]` [SUPPORTER] ⚡️[experimental] set this to the name (excluding arguments/parentheses) of a PG function to call to check user is allowed to subscribe
  * `readOnlyConnection` [PRO] ⚡️[experimental] set this to a PostgreSQL connection string to use for read-only queries (i.e. not mutations)
  * `defaultPaginationCap` [PRO] ⚡️[experimental] integer, ensure all connections have first/last specified and are no large than this value (default: 50), set to -1 to disable; override via smart comment `@paginationCap 50`
  * `graphqlDepthLimit` [PRO] ⚡️[experimental] integer, validate GraphQL queries are no deeper than the specified int (default: 16), set to -1 to disable
  * `graphqlCostLimit` [PRO] ⚡️[experimental] integer, only allows queries with a computed cost below the specified int (default: 1000), set to -1 to disable
  * `exposeGraphQLCost` [PRO] boolean, if true (default) then the calculated query cost will be exposed on the resulting payload

### Exposing HTTP request data to PostgreSQL

#### `pgSettings` function

Using the `pgSettings` functionality mentioned above you can extend the data
made available through `current_setting(...)` within PostgreSQL. Instead of
passing an object you can pass a function which will be executed for each
request, and the results merged in with the other settings PostGraphile
automatically adds to the request.

For example:

```js
export postgraphile(process.env.DATABASE_URL, schemaName, {
  pgSettings: req => ({
    'user.id': `${req.session.passport.user}`,
    'http.headers.x-something': `${req.headers['x-something']}`,
    'http.method': `${req.method}`,
    'http.url': `${req.url}`,
    //...
  }),
})
```

```sql
create function get_x_something() returns text as $$
  select current_setting('http.headers.x-something', true)::text;
$$ language sql stable;
```

Everything returned by pgSettings is applied to the current session with ```set_config($key, $value, true)```

Internal Postgres settings (keys without periods) can be changed directly such as 'role':

```js
export postgraphile(process.env.DATABASE_URL, schemaName, {
  pgSettings: req => ({
    'role': 'visitor',
    'jwt.claims.user_id': `${req.user.id}`,
    //...
  }),
})
```

```sql
select current_user; -- returns visitor
```

TODO: verify the above works.

TODO: move this to its own article?

[connect]: https://www.npmjs.com/connect
[express]: https://www.npmjs.com/express
[graphql/express-graphql#82]: https://github.com/graphql/express-graphql/pull/82
[`pg`]: https://www.npmjs.com/pg
[morgan]: https://www.npmjs.com/morgan
