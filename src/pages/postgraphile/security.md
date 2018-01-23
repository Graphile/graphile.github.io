---
layout: page
path: /postgraphile/security/
title: Security
---

## Security

Traditionally in web application architectures the security is implemented in
the server layer and the database is treated as a simple store of data. Partly
this was due to necessity (the security policies offered by databases such as
PostgreSQL were simply not granular enough), and partly this was people
figuring it would reduce the workload on the database thus increases
scalability. However, as applications grow, they start needing more advanced
features or additional services to interact with the database.  There's a
couple options they have here: duplicate the authentication/authorization logic
in multiple places (which can lead to discrepancies and increases the surface
area for potential issues), or make sure everything goes through the original
application layer (which then becomes both the development and performance
bottleneck).

However, this is no longer necessary since PostgreSQL introduced much more
granular permissions in the form of [Row-Level Security (RLS)
policies](https://www.postgresql.org/docs/9.6/static/ddl-rowsecurity.html) in
PostgreSQL 9.5 back at the beginning of 2016. Now you can combine this with
PostgreSQL established permissions system (based on roles) allowing your
application to be considerably more specific about permissions: adding
row-level permission constraints to the existing table- and column-based
permissions.

Now that this functionality is stable and proven, we advise that you protect
your lowest level - the data itself. By doing so you can be sure that no matter
how many services interact with your database they will all be protected by the
same underlying permissions logic, which you only need to maintain in one
place. You can add as many microservices as you like, and they can talk to the
database directly!

When enabled, all rows are by default not visible to any roles (except database
administration roles and the role who created the database/table); and
permission is selectively granted with the use of policies.

If you already have a secure database schema that implements these technologies
to protect your data at the lowest levels then you can leverage
`postgraphile` to generate a powerful, secure and fast API very rapidly. You
just need to generate JWT tokens for your users, and we even help you with
that!

### Processing JWTs

To enable the JWT functionality you must provide a `--jwt-secret` on the CLI
(or `jwtSecret` to the library options). This will allow PostGraphile to
authenticate incoming JWTs and set the granted claims on the database
transaction.

You should also supply a `--default-role` which is used for requests that don't
specify a role.

### Generating JWTs

PostGraphile also has support for generating JWTs easily from inside your
PostgreSQL schema.

To do so we will take a composite type that you specify via
`--jwt-token-identifier` and whenever a value of that type is returned from a
PostgreSQL function we will instead sign it with your `--jwt-secret` and return
it as a string JWT token as part of your GraphQL response payload.

For example, you might define a composite type such as this in PostgreSQL:

```sql
create type my_private_schema.jwt_token(
  role text,
  exp integer,
  person_id integer,
  is_admin boolean,
  username varchar
);
```

Then run postgraphile as:

```
postgraphile \
  --jwt-token-identifier my_private_schema.jwt_token \
  --jwt-secret $JWT_SECRET \
  -c postgres://user:pass@host/dbname \
  -s my_public_schema
```

And finally you might add a PostgreSQL function such as:

```sql
create function my_public_schema.authenticate(
  email text,
  password text
) returns forum_example.jwt_token as $$
declare
  account my_public_schema.person_account;
begin
  select a.* into account
    from my_public_schema.person_account as a
    where a.email = authenticate.email;

  if account.password_hash = crypt(password, account.password_hash) then
    return (
      'person_role',
      86400,
      account.person_id,
      account.is_admin,
      account.username
    )::my_private_schema.jwt_token;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;
```

Which would give you an `authenticate` mutation with which you can extract the
`jwtToken` from the response payload.

TODO: test this!

### Sending JWTs to the server

JWTs are sent via the best practice `Authorization` header:

```
Authorization: Bearer JWT_TOKEN_HERE
```

e.g. with Apollo:

```js
networkInterface.use([{
  applyMiddleware(req, next) {
    const token = getJWTFromSomewhere();
    if (token) {
      req.options.headers = _.extend(req.options.headers, {
        authorization: `Bearer ${token}`
      });
    }
    next();
  }
}]);
```

or with Relay:

```js
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('/graphql', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
);
```

### How it works

Your JWT token will include a number of claims, something like:

```json
{
  "aud": "postgraphql",
  "role": "app_user",
  "user_id": 27
}
```

When we verify that the JWT token is for us (via `aud: "postgraphql"`) we can
authenticate the PostgreSQL client that is used to perform the GraphQL query.
We do this as follows:

```sql
begin;
set local role app_user;
set local jwt.claims.role to 'app_user';
set local jwt.claims.user_id to '2';

-- WE PERFORM GRAPHQL QUERIES HERE

commit;
```

> _Actually, to save roundtrips we perform just one query to set all configs
via ..._
```sql
select set_config('role', 'app_user', true), set_config('user_id', '2',
true), ...
```
 > _... but showing `set local` is simpler to understand._

You can then access this information via `current_setting` (the second argument
says it's okay for the property to be missing, but **only works in PostgreSQL
9.6+**, in previous versions you'll need to set the setting on the database to
the empty string); for example here's a helper function:

```sql
create function current_user_id() returns integer as $$
  select nullif(current_setting('jwt.claims.user_id', true), '')::integer;
$$ language sql stable security definer;
```

e.g. you might have a row level policy such as:

```sql
create policy update_if_author
  on comments
  for update
  using ("userId" = current_user_id())
  with check ("userId" = current_user_id());
```
