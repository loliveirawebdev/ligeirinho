# Security and zero trust

Zero trust is the philosophy behind everything: no request, service or piece of data is trusted just because it's
"inside".

## Deny by default

A new route, role or entity grants access to nothing until it's explicitly allowed. In Nest, a global guard
requires authentication and a declared permission on every route; a route without one answers 403. A public route
is declared with `@Public()` and shows up in review.

**Why:** forgetting to protect something is the most common mistake (OWASP API1 and API5). With deny by default,
forgetting closes instead of opening.

**Enforced by:** an architecture test that walks every registered route and fails if one has neither a permission
nor `@Public()`; checklist for every new `@Public()`.

## Always verify

Every request is authenticated and authorized, including between internal services. Authorization looks at **the
object** (does this registration belong to this user?), not just the role.

**Why:** broken object-level authorization (BOLA, OWASP API1) is the number one flaw in APIs.

**Enforced by:** the authorization tests for each route (below); checklist for queries that look up by id without
filtering by owner/tenant.

## Every new route has tests for who can and who can't

For each route: one test with someone who can (success), one with each role that can't (403), one without
authentication (401) and, if the route takes an id, one with another owner's id (404, so existence doesn't leak).

**Enforced by:** the plan lists these tests; the close checks them.

## Least privilege

Every token, user, service and connection gets only what it needs. The application's database user doesn't own
the schema (migrations run with another user). Tokens are scoped and short-lived.

**Enforced by:** checklist; the template already creates separate users in Postgres.

## Validate at every edge

API, queues, responses from external services and **environment variables at startup** (a schema that stops the
application if a value is missing or wrong).

**Enforced by:** the global `ValidationPipe`; the env schema in the template's bootstrap; checklist for external
adapters that don't validate the response.

## Secrets never in code, logs or URLs

Secrets come from environment variables or a vault. The logger has a list of redacted fields (`password`,
`token`, `authorization`, `secret`, `cookie`…). Nothing sensitive in query strings (they end up in proxy logs and
browser history).

**Enforced by:** Spectral (no secrets in path/query, see [rest-api.md](rest-api.md)); gitleaks in the gate;
checklist for logs.

## Sensitive changes produce an audit event

Changes to permissions, personal data, money, security settings, and login/logout produce an audit event (who,
what, when, from where), stored in a way the application can't delete.

**Enforced by:** the plan flags the sensitive operations; the close checks the event and its test.

## References the plan consults

- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/

The plan researches how the feature's problem is usually solved and **cites its sources**.
