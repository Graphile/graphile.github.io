---
layout: page
path: /postgraphile/make-wrap-resolvers-plugin/
title: makeWrapResolversPlugin
---

## makeWrapResolversPlugin

**NOTE: this documentation applies to PostGraphile v4.1.0+**

This plugin enables you to easily take actions before or after an existing GraphQL field resolver, or even to prevent the resolver being called.

IMPORTANT: Because PostGraphile uses the Graphile Engine look-ahead features, overriding a resolver may not effect the SQL that will be generated. If you want to influence how the system executes, only use this for modifying root-level resolvers (as these are responsible for generating the SQL and fetching from the database); however it's safe to use resolver wrapping for augmenting the returned values (for example masking private data, performing normalisation, etc) on any field.

There's two methods of calling `makeWrapResolversPlugin`. If you want to wrap one or two specific resolvers (where you know the type name and field name) then method 1 is a handy shortcut. If, however, you want to wrap a number of resolvers in the same way then the more flexible method 2 is what you want.

```typescript
// Method 1: wrap individual resolvers of known fields
function makeWrapResolversPlugin(
  rulesOrGenerator: ResolverWrapperRules | ResolverWrapperRulesGenerator
): Plugin;

// Method 2: wrap all resolvers that match a filter function
function makeWrapResolversPlugin<T>(
  filter: (
    context: Context,
    build: Build,
    field: GraphQLFieldConfig,
    options: Options
  ) => T,
  rule: (match: T) => ResolverWrapperRule | ResolverWrapperFn
);

/****************************************/

interface ResolverWrapperRules {
  [typeName: string]: {
    [fieldName: string]: ResolverWrapperRule | ResolverWrapperFn;
  };
}
type ResolverWrapperRulesGenerator = (options: Options) => ResolverWrapperRules;
```

### Method 1: wrapping individual resolvers of known fields

```typescript
function makeWrapResolversPlugin(
  rulesOrGenerator: ResolverWrapperRules | ResolverWrapperRulesGenerator
): Plugin;
```

In this method, `makeWrapResolversPlugin` takes either the resolver wrapper rules object directly, or a generator for this rules object, and returns a plugin. e.g.:

```js
module.exports = makeWrapResolversPlugin({
  User: {
    async email(resolve, source, args, context, resolveInfo) {
      const result = await resolve();
      return result.toLowerCase();
    },
  },
});
```

The rules object is a two-level map of `typeName` (the name of a GraphQLObjectType) and `fieldName` (the name of one of the fields of this type) to either a rule for that field, or a resolver wrapper function for that field. The generator function accepts an `Options` object (which contains everything you may have added to `graphileBuildOptions` and more).

```ts
interface ResolverWrapperRules {
  [typeName: string]: {
    [fieldName: string]: ResolverWrapperRule | ResolverWrapperFn;
  };
}
type ResolverWrapperRulesGenerator = (options: Options) => ResolverWrapperRules;
```

Read about [resolver wrapper functions below](#resolver-wrapper-functions).

For example, this plugin wraps the `User.email` field, returning `null` if
the user requesting the field is not the same as the user for which the email
was requested. (Note that the email is still retrieved from the database, it
is just not returned to the user.)

```js
const { makeWrapResolversPlugin } = require("graphile-utils");

module.exports = makeWrapResolversPlugin({
  User: {
    email: {
      requires: {
        siblingColumns: [{ column: "id", alias: "$user_id" }],
      },
      resolve(resolver, user, args, context, _resolveInfo) {
        if (context.jwtClaims.user_id !== user.$user_id) return null;
        return resolver();
      },
    },
  },
});
```

### Method 2: wrap all resolvers matching a filter

```typescript
function makeWrapResolversPlugin<T>(
  filter: (
    context: Context,
    build: Build,
    field: GraphQLFieldConfig,
    options: Options
  ) => T | null,
  rule: (match: T) => ResolveWrapperRule | ResolveWrapperFn
);
```

In this method, `makeWrapResolversPlugin` takes two function arguments. The first function is a filter that is called for each field; it should return a truthy value if the field is to be wrapped (or `null` otherwise). The second function is called for each field that passes the filter, it will be passed the return value of the filter and must return a resolve wrapper function or rule (see [Resolver wrapper functions](#resolver-wrapper-functions) below).

The filter is called with the following arguments:

* `context`: the `Context` value of the field, the `context.scope` property is the most likely to be used
* `build`: the `Build` objects which contains a lot of helpers
* `field`: the field specification itself
* `options`: object which contains everything you may have added to `graphileBuildOptions` and more

The value you return can be any arbitrary truthy value, it should contain anything from the above arguments that you need to create your resolver wrapper.

```js
// Example: log before and after each mutation runs
module.exports = makeWrapResolversPlugin(
  context => {
    if (context.scope.isRootMutation) {
      return { scope: context.scope };
    }
    return null;
  },
  ({ scope }) => async (resolver, user, args, context, _resolveInfo) => {
    console.log(`Mutation '${scope.fieldName}' starting with arguments:`, args);
    const result = await resolver();
    console.log(`Mutation '${scope.fieldName}' result:`, result);
    return result;
  }
);
```

### Resolver wrapper functions

A resolver wrapper function is similar to a GraphQL resolver, except it takes an additional argument (at the start) which allows delegating to the resolver that is being wrapped. If and when you call the `resolve` function, you may optionally pass one or more of the arguments `source, args, context, resolveInfo`; these will then override the values that the resolver will be passed. Calling `resolve()` with no arguments will just pass through the original values unmodified.

```ts
type ResolverWrapperFn = (
  resolve: GraphQLFieldResolver, // Delegates to the resolver we're wrapping
  source: TSource,
  args: TArgs,
  context: TContext,
  resolveInfo: GraphQLResolveInfo
) => any;
```

Should your wrapper require additional data, for example data about it's
sibling or child columns, then instead of specifying the wrapper directly you
can pass a rule object. The rule object should include the `resolve` method
(your wrapper) and can also include a list of requirements. It's advised that
your alias should begin with a dollar `$` symbol to prevent it conflicting
with any aliases generated by the system.

```ts
interface ResolverWrapperRequirements {
  childColumns?: Array<{ column: string; alias: string }>;
  siblingColumns?: Array<{ column: string; alias: string }>;
}
interface ResolverWrapperRule {
  requires?: ResolverWrapperRequirements;
  resolve?: ResolverWrapperFn;
  // subscribe?: ResolverWrapperFn;
}
```
