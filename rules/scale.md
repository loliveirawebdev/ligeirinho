# Scale

| Rule | Why | Enforced by |
|---|---|---|
| **Lists are always paginated** (cursor by default; server-side maximum limit) | an unbounded list takes down the API and the database when the table grows (OWASP API4) | Spectral: a collection `GET` without pagination parameters fails; checklist |
| **An index for every new query** | a query without an index is fast in dev and slow in production | plan checklist (each new query names its index); integration tests can run `EXPLAIN` on critical queries |
| **No N+1** | one query per item multiplies latency | checklist; Prisma with explicit `include`/`select`; integration tests count queries in list use cases |
| **Idempotency for repeatable operations** (`Idempotency-Key` on `POST`s that create or charge) | the network retries requests; without a key, things get created twice | plan checklist for operations that touch money, sending, or creation from flaky clients |
| **Rate limiting** on every route, tighter on login, invites and sending | abuse and brute force (OWASP API4, API6) | global guard in the template; checklist for sensitive routes |
| **Cache only with a clear invalidation rule** written in the area doc | a cache without a rule shows stale data and nobody knows why | checklist |
| **Heavy work goes to a queue** (email, reports, external integrations) | an HTTP request doesn't wait on slow work | checklist |
| **Outbox** for events that can't be lost | writing to the database and publishing to a queue isn't atomic; an outbox is | plan checklist |
