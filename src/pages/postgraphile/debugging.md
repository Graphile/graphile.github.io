---
layout: page
path: /postgraphile/debugging/
title: Debugging
---

## Debugging

When something's wrong with your app it can be hugely frustrating; so we want to make
it as easy as we can for you to get to the bottom of these issues!


### Step 1: check you're requesting what you think you're requesting

Often issues occur because your client code isn't doing what you think it's
doing. The first step here is to determine exactly what's being sent over the
network. If you're building a website you can easily use Google Chrome's
Network Devtools to see exactly what's being sent and received.

1. Open your website in Chrome
2. Right click, and select 'Inspect'
3. Select the 'Network' tab in the developer tools
4. In the filter box, enter '/graphql' (or whatever path you have configured your API to use)
5. Ensure that 'All' is selected to the right of the filter box
6. Trigger your GraphQL request (either by reloading the page or by clicking the relevant element on the screen)
7. Review the network requests that have arrived to ensure they're what you'd expect, that no variables are unexpectedly null, that the relevant access tokens are being set in the request headers, etc

### Step 2: try your query in GraphiQL

It sometimes helps to try doing the same thing a different way, and this is
where GraphiQL comes in handy. Take the query you're running and execute it via
GraphiQL. Is it producing the same issue? Note that we currently do not support
setting headers in GraphiQL (although it is set to use `Credentials:
same-origin` which is helpful if you're using cookie-based sessions).

### Step 3: viewing the generated SQL

Assuming that the error is coming from within the database, you can see what
SQL statements PostGraphile is generating. To do so, restart PostGraphile,
being sure to set the relevant [DEBUG](https://github.com/visionmedia/debug)
environmental variable first. For example:

```bash
export DEBUG="postgraphile:postgres"
```

Note that this works with PostGraphile CLI and also when using PostGraphile as an express middleware.

To find details of any errors thrown whilst executing SQL, use:

```bash
export DEBUG="postgraphile:postgres,postgraphile:postgres:error"
# or:
export DEBUG="postgraphile:postgres*"
```


### DEBUG envvars

We use a lot of DEBUG envvars for different parts of the system. Here's some of the ones you might care about:

- `postgraphile:cli` - informs about plugins being loaded
- `postgraphile:graphql` - prints out the full GraphQL query after validation and before execution
- `postgraphile:request` - prints out statuses during the HTTP request life-cycle
- `postgraphile:postgres` - prints out every SQL statement that's issued to the database (does not include placeholder values)
- `postgraphile:postgres:error` - outputs any errors generated whilst executing SQL statements
- `graphile-builder` - desperately in need of renaming, this hook is extremely useful for understanding the order in which hooks execute, and how hook executions can nest - a must for people getting started with graphile-build plugins
- `graphile-build-pg` - prints out various things, many of which should not occur. Also used to output errors from the update/delete mutations (where `null` is returned to GraphQL)
- `graphile-build-pg:warn` - prints out warnings that occur during schema generation; these warnings might hint at field conflicts and similar issues
- `graphile-build-pg:sql` - prints out _some_ SQL statements, you probably want `postgraphile:postgres` instead
- `graphql-parse-resolve-info` - far more information than you could possibly need regarding how we process the resolveInfo / AST

To enable these DEBUG modes, join them with commas when setting a DEBUG envvar, then run PostGraphile or your Node.js server in the same terminal:

```bash
export DEBUG="postgraphile:graphql,postgraphile:request,postgraphile:postgres*"
postgraphile -c postgres://...
```

### Advanced: getting your hands dirty

If you're a plugin author, you think you've discovered an issue in
PostGraphile, or you just like seeing how things work, you can use the Chrome
Debug tools to debug the node process - add breakpoints, break on exceptions,
and step through code execution.

1. Visit `chrome://inspect` in Google Chrome (we can't hyperlink it for security reasons).
2. Select 'Open dedicated DevTools for Node', a new devtools window should open - don't close this!
3. Run your server or PostGraphile via Node.js directly, in `--inspect` mode, e.g.:

```
# For globally installed PostGraphile:
node --inspect `which postgraphile`

# or for locally installed PostGraphile:
node --inspect node_modules/.bin/postgraphile

# or, if you have your own Node.js app in `server.js`:
node --inspect server.js
```
