# SDE Backend Interview Detailed Answers (Easy → Hard)

This is a **detailed, revision-ready answer bank** for the interview questions in `docs/SDE_BACKEND_INTERVIEW_QUESTIONS.md`.

How to study each answer:
- **Step 1 (30s)**: Speak the direct answer.
- **Step 2 (2-4 min)**: Add architecture + trade-offs + failure handling.
- **Step 3**: Relate to this project’s current design.

---

## Easy Level (Foundations)

### 1) Role of Express and route organization
Express is the web framework that handles HTTP requests, middleware chaining, routing, and responses. In this project, `index.js` configures global middleware and mounts route modules (`/url`, `/user`, static routes). Route files define endpoint paths, while controllers hold handler logic.

### 2) `app.use('/url', ...)` vs `router.get('/:shortID', ...)`
`app.use('/url', urlRouter)` mounts a router under a base prefix. So a handler inside that router like `router.post('/')` becomes `/url/`. `router.get('/:shortID')` defines a specific route pattern with a path parameter, e.g., `/abc123`.

### 3) Lifecycle for creating a short URL
Request enters Express → body parsers run → authentication middleware (if protected route) sets `req.user` → controller validates `redirectURL` → generates short ID → writes document in MongoDB → returns short URL response (JSON or EJS render).

### 4) Why `express.json()` and `express.urlencoded()`
- `express.json()` parses JSON payloads (API clients/Postman/frontend apps).
- `express.urlencoded()` parses form submissions from HTML forms.
Without these, `req.body` is undefined for corresponding content types.

### 5) What `cookie-parser` does
It parses incoming cookie headers and exposes them as `req.cookies`. Auth middleware can then read JWT/session cookies reliably.

### 6) What Mongoose gives over raw MongoDB driver
Schema modeling, validation, defaults, middleware/hooks, simple model APIs, built-in timestamps, and index definitions. It improves consistency and developer productivity.

### 7) Purpose of `shortId`
`shortId` is the unique lookup key in the short URL path (`/{shortId}`). Redirect logic uses it to find the original long URL.

### 8) Why `shortId` should be unique
Non-unique short IDs cause ambiguous mapping and wrong redirects. Unique index ensures integrity under concurrent writes.

### 9) `timestamps: true` meaning
Mongoose auto-adds `createdAt` and `updatedAt` and updates them automatically. Useful for auditing, sorting, analytics windows, and TTL decisions.

### 10) Why `nanoid(8)` over sequential IDs
Sequential IDs are easy to enumerate and scrape. Random IDs reduce predictability and raise abuse resistance.

### 11) Controllers vs route file responsibilities
Routes: URL mapping + middleware order. Controllers: request validation, business logic, DB operations, and response shaping.

### 12) `res.render()` vs `res.json()`
`res.render()` returns HTML via EJS templates (server-side rendered pages). `res.json()` returns structured API data for clients.

### 13) Status code for short URL not found
`404 Not Found` is correct because the requested short link resource does not exist.

### 14) Why validate login/register body
Prevents invalid input, avoids DB misuse, improves security, reduces unexpected runtime errors, and gives consistent error feedback.

### 15) JWT stateless auth high-level flow
Server signs token with claims (user id/role/exp). Client sends token on each request. Server verifies signature and expiry, then trusts claims without server-side session lookup (unless revocation checks are added).

---

## Easy-Medium (Practical Backend Basics)

### 16) Login flow: `POST /user/login` to cookie
1. Receive email/password.
2. Find user by email.
3. Verify password (should be hash compare).
4. Create JWT with claims (`sub`, role, exp).
5. Set cookie (`httpOnly`, `secure`, `sameSite`).
6. Return success payload/redirect.

### 17) How `checkforAuthentication` sets user context
Middleware extracts token from cookie/header, verifies it, decodes claims, normalizes user object, and sets `req.user` so downstream handlers can do authorization and data scoping.

### 18) `restrictedTologin(["NORMAL"])` meaning
This enforces role-based access control: only authenticated users whose role is included in the allowed list can access the route.

### 19) If auth middleware runs before cookie-parser
Token read from `req.cookies` fails because cookies are not parsed yet. Users get false unauthorized errors.

### 20) Why plaintext passwords are dangerous + fix
Plaintext in DB means immediate compromise if DB leaks. Fix with bcrypt/argon2 hashing + salt, optional pepper, breach monitoring, reset flows, and phased migration.

### 21) Purpose of `httpOnly` on cookies
Prevents JavaScript from reading auth cookies, reducing token theft via XSS.

### 22) `secure` and `sameSite` usage
- `secure`: cookie only over HTTPS.
- `sameSite`: controls cross-site send behavior (`Lax`, `Strict`, `None`).
For production auth cookies: typically `httpOnly: true`, `secure: true`, and `sameSite` chosen based on frontend deployment model.

### 23) Why secrets must be in env vars
Hardcoded secrets leak via git history and code sharing. Environment/secrets-manager based config supports safe rotation and environment-specific values.

### 24) Inconsistent role names risk
If model has `NORMAL_USER` but middleware expects `NORMAL`, authorization behavior becomes incorrect (false deny or unintended allow).

### 25) Why URL input validation is critical
Prevents malformed links, invalid schemes, malicious payloads, and abuse vectors. It protects users and keeps data clean.

### 26) Validate only `http/https` redirect URLs
Use `new URL(value)` and allow only protocols `http:` and `https:`. Reject other protocols (`javascript:`, `data:`, `file:`).

### 27) Open redirect risk in shorteners
Attackers shorten malicious/phishing links, leveraging your trusted domain to increase click-through and bypass user suspicion.

### 28) Why too many `console.log` is harmful
No structure, high noise, potential sensitive data leaks, slower debugging, and poor production observability.

### 29) Standard API error response shape
Use stable schema like:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid URL", "details": [] }, "requestId": "..." }
```

### 30) Why naming consistency matters
Consistent naming prevents logic mismatches, reduces cognitive load, and makes refactoring/testing safer.

---

## Medium (Reliability, Data, API Design)

### 31) `findOne` vs `updateOne` vs `findOneAndUpdate`
- `findOne`: fetch one doc.
- `updateOne`: update matching doc (no updated document return by default).
- `findOneAndUpdate`: atomic find+update, can return updated doc with options.
For counters, `findOneAndUpdate` with `$inc` avoids race-prone read-modify-write.

### 32) Where double-click increment can happen
If multiple redirect handlers or duplicate routes update clicks for same request, one user hit counts more than once, corrupting analytics.

### 33) Idempotent click increment strategy
Use one canonical redirect endpoint. For strict dedupe, generate request id and store short-lived dedupe key (`shortId + requestId`) before increment.

### 34) Indexes for high-traffic paths
- Unique index on `shortId`.
- Index on `createdBy` for dashboard listing.
- Time-based index for analytics by time buckets.
- Compound index per query pattern (e.g., `createdBy + createdAt`).

### 35) Unbounded `totalClicksHistory` scaling issue
Growing arrays increase document size, write amplification, memory pressure, and risk document limits; it also slows reads/updates.

### 36) Analytics redesign at scale
Split storage:
- raw events (append-only, partitioned),
- aggregates (hour/day counters).
Use async pipeline (queue + worker) so redirect latency remains low.

### 37) Pagination for user URL list
Prefer cursor pagination (`createdAt`, `_id`) for stable performance and consistency under concurrent writes. Offset is simpler but slower on large datasets.

### 38) Embedding vs separate click collection
Embedding: simple, fewer joins, good for small bounded history.
Separate collection: scalable, query-friendly, better for large analytics.

### 39) Endpoint for day/week/month analytics
`GET /url/:shortId/analytics?granularity=day&from=...&to=...`
Return bucketed counts + totals + optional uniques. Validate range limits.

### 40) Ensure uniqueness under concurrent requests
Rely on DB unique index and retry short-code generation on duplicate key error.

### 41) Support custom aliases safely
Validate alias format, block reserved words, enforce unique index, and return `409 Conflict` when alias already used.

### 42) API versioning design (`/api/v1`)
Version in URL; keep old versions stable; add breaking changes only in new version. Document deprecation timeline.

### 43) Backward compatibility risks in response changes
Removing/renaming fields, changing types/status codes, or changing auth behavior can break clients unexpectedly.

### 44) DTO/validation layer in Express
Define schema per route (Joi/Zod), validate in middleware, convert to typed DTO, pass sanitized data to service, centralize validation errors.

### 45) Global error handling without leaks
Central error middleware maps known errors to safe messages, logs stack server-side, returns normalized client error response with requestId.

### 46) Central logging with correlation IDs
Assign `x-request-id` per request (or propagate existing) and include it in every log line, outbound call, and error to trace end-to-end.

### 47) `/healthz` and `/readyz`
- `/healthz`: process alive.
- `/readyz`: dependencies available (DB, cache, queue), config loaded.
Kubernetes should use readiness to route traffic.

### 48) Graceful shutdown for Node + Mongo
On SIGTERM: stop accepting new requests, wait for inflight completion with timeout, close DB/cache connections, flush logs, exit.

### 49) What to cache and where
Cache `shortId -> longURL` mapping and maybe policy metadata.
- In-memory cache: fast but per-instance only.
- Redis: shared across instances, better for scaling.

### 50) Avoid cache stampede
Use request coalescing, per-key lock, stale-while-revalidate, random TTL jitter, and negative caching for misses.

---

## Medium-Hard (Security + Distributed Systems Thinking)

### 51) Rate limiting for create/redirect
Use different policies:
- strict for login/create,
- higher limit for redirects.
Key by IP + user/tenant, store counters in Redis for distributed consistency.

### 52) Protect login from brute force
Rate limit + exponential backoff + temporary lock + MFA + suspicious login alerts.

### 53) JWT revocation strategies
- short token expiry,
- refresh token rotation,
- token version field in DB,
- denylist for emergency revocation,
- key rotation for mass invalidation.

### 54) When to choose opaque sessions
When you need immediate revoke, centralized control, simpler compliance posture, and can accept stateful session store.

### 55) CSRF: cookie auth vs bearer token
Cookie auth is CSRF-prone because browser auto-sends cookies. Need CSRF token + sameSite.
Bearer tokens in Authorization headers are less CSRF-prone but still require XSS defenses.

### 56) Secure admin routes + audit
Strong RBAC, MFA, least privilege, immutable audit logs, alerting on unusual admin actions.

### 57) Domain allow/deny list design
Normalize hostnames, check denylist/threat feeds, optionally enforce allowlist, support async reclassification and appeal workflow.

### 58) SSRF-like risks in URL workflows
If backend fetches URL previews/metadata, attacker may force requests to internal networks. Block private IP ranges, metadata endpoints, and enforce egress controls.

### 59) Security headers via Helmet
Enable CSP, HSTS, X-Content-Type-Options, Frameguard, Referrer-Policy, and remove `X-Powered-By`.

### 60) JWT signing key rotation
Add `kid` in token header, maintain active+previous keys, verify both during rollout, then retire old key after token TTL.

### 61) Auth and redirect service secure communication
Use mTLS, service identity, short-lived service credentials, and internal authorization policies.

### 62) At-least-once vs exactly-once for clicks
Exactly-once is expensive; practical systems use at-least-once + idempotency/dedupe keys to control double count.

### 63) DB outage failure modes in redirect
Higher latency, timeouts, 5xx spikes. Mitigate with cache-first lookup, circuit breakers, fallback mode, and controlled degradation.

### 64) Block redirect on analytics failure?
Usually no. Keep user redirect path fast and reliable; send analytics asynchronously with retries and dead-letter queues.

### 65) Fallback behavior for partial outages
Serve from cache, queue writes, disable noncritical features, rate-limit abusive traffic, and expose degraded-health signals.

### 66) Prevent phishing/spam abuse
Automated reputation checks, domain risk scoring, abuse reports, account trust levels, velocity limits, and moderation workflows.

### 67) Detect anomalous bot traffic
Analyze request velocity, user-agent entropy, IP reputation, geo anomalies, and impossible click patterns; classify and down-weight suspicious events.

### 68) Multi-tenant isolation model
Every record scoped by tenant ID, strict authorization filters, tenant-level quotas, optional per-tenant encryption keys.

### 69) Consistency model for analytics counters
Eventual consistency is generally acceptable for analytics; strict consistency usually reserved for billing/security-critical paths.

### 70) Mongo transactions vs eventual consistency
Use transactions only for strict cross-document invariants. For high-throughput analytics, asynchronous eventual consistency is often better for scalability.

---

## Hard (System Design + Production Leadership)

### 71) Design for 100M redirects/day
Architecture:
1. DNS + CDN edge.
2. Global load balancer.
3. Stateless redirect service pods.
4. Redis cluster for hot mappings.
5. MongoDB sharded cluster for source-of-truth mapping.
6. Async analytics queue + stream processors + aggregate store.
Bottlenecks: hot keys, cache misses, DB shard hotspots, queue lag.

### 72) Storage estimate for 1 year analytics
Method:
- Events/day × bytes/event × 365.
- Multiply by replication factor.
- Add index/storage overhead (2–4x).
- Add retention tiering (hot/warm/cold).
Interviewers value the estimation method more than exact number.

### 73) Low-latency Redis + Mongo path
Read: Redis hit → redirect quickly; miss → Mongo lookup → populate Redis.
Write: persist Mongo, then cache set/invalidate.
Use short TTL and background refresh for hot keys.

### 74) Sharding short URL data in Mongo
Use hashed shard key on `shortId` for even distribution. Avoid range sharding on monotonic keys to prevent hotspotting.

### 75) Multi-region traffic strategy
Geo-route reads to nearest region. Use replication and clear write ownership policy (single-writer per keyspace or conflict-resolution strategy).

### 76) Replication + failover strategy
Replica sets in each region, cross-region backups/replicas, automated failover runbooks, and traffic manager health-based rerouting.

### 77) Migration to analytics aggregation schema
Dual-write legacy + new pipeline, backfill historical data, compare outputs, switch read path with feature flag, then deprecate old fields.

### 78) Zero-downtime deployments
Use rolling/canary/blue-green, backward-compatible DB changes, readiness probes, feature flags, and instant rollback plan.

### 79) SLOs/SLIs definition
Typical:
- Availability SLO (e.g., 99.95% redirect success).
- Latency SLO (p95/p99).
- Error budget to control release risk.

### 80) Dashboards and alerts
Build golden-signal dashboards (latency, errors, traffic, saturation), dependency views (DB/cache/queue), and actionable alerts with severity.

### 81) Incident response for 5xx spike
Declare incident, assign roles, mitigate quickly (rollback/shift traffic), inspect recent changes, track timeline, communicate status, run postmortem.

### 82) Load test + capacity planning
Run baseline, stress, soak, and spike tests with realistic patterns (hot keys, burst traffic). Determine scaling thresholds and safe headroom.

### 83) Secure secrets/config in CI/CD/runtime
Use managed secret store, short-lived credentials, least privilege IAM, encrypted transit/at rest, secret scanning, and rotation automation.

### 84) Blue-green/canary for auth middleware changes
Deploy behind feature flag, route small percentage traffic, monitor auth failures/latency, gradually ramp, automatic rollback on SLO breach.

### 85) Prove backward compatibility during refactor
Use contract tests, schema compatibility checks, consumer tests, and shadow traffic comparison between old/new paths.

### 86) Signals for app bug vs infra issue
App bug: error spike after deploy, specific endpoints failing, stack traces.
Infra issue: DB timeout/connectivity failures, network errors across services, resource saturation metrics.

### 87) DR design/testing (RPO/RTO)
Define target data loss and recovery time; implement backups + cross-region replication; run periodic restore drills and failover game days.

### 88) Prevent one hot short URL overload
CDN caching, per-key throttling, request collapsing, specialized cache TTL for viral keys, and autoscaling triggers.

### 89) Cost-efficient long-term archival
Keep recent aggregates in hot store; move old raw events to compressed object storage partitions; query old data with batch engines.

### 90) Evolve monolith to services safely
Extract by bounded context incrementally, keep strong contracts, invest in platform/observability first, avoid over-fragmentation early.

### 91) (Hard extension) Ownership model during service split
Define clear team ownership, on-call responsibilities, and service-level runbooks before extraction to avoid operational gaps.

### 92) (Hard extension) Release governance at scale
Introduce progressive delivery standards, quality gates, and rollback rehearsals to keep deployment safety high.

### 93) (Hard extension) Platform requirements
Central logging, tracing, service discovery, secret management, and policy enforcement should be standardized before many services.

### 94) (Hard extension) Data contract governance
Version events/schemas, add compatibility checks in CI, and ensure producer-consumer coordination.

### 95) (Hard extension) Cost governance
Track per-service unit cost (cost per 1k redirects), optimize cache hit rates, and right-size infra.

### 96) (Hard extension) Reliability governance
Use error budgets to pace feature releases; freeze risky changes when budget is exhausted.

### 97) (Hard extension) Security at scale
Centralized authn/authz policy, key management, audit trails, and threat detection across services.

### 98) (Hard extension) Data lifecycle policy
Define retention by data class (events, logs, audit data) with legal/compliance controls.

### 99) (Hard extension) Organizational risk minimization
Migrate service-by-service with measurable milestones, preserving user-facing reliability as first KPI.

### 100) (Hard extension) Build vs buy decision framework
Evaluate by time-to-market, operational burden, compliance needs, lock-in risk, and total cost of ownership.

---

## Code-Specific Deep-Dive Prompts — Detailed Answering Templates

### 1) Refactor auth to bcrypt + secure cookies + migration
- Add hash columns for all users.
- On login: if legacy password matches, rehash and replace.
- Set secure cookie flags and token expiry.
- Force reset for stale/weak credentials.

### 2) Remove duplicate redirect path + fix double count
- Keep one canonical redirect route.
- Perform atomic `$inc` once.
- Add integration test ensuring one increment per redirect.

### 3) Validation middleware for `/user`, `/user/login`, `/url`
- Define schemas centrally.
- Run pre-controller validation.
- Return consistent 400 envelope.

### 4) Env-based config loader + startup validation
- One config module reads env.
- Validate required keys on startup.
- Fail-fast if missing critical config.

### 5) Role constants + claim/model alignment
- Use shared enum in model, token generation, middleware checks.
- Add tests for role-based route access.

### 6) Structured logging
- Use JSON logger (pino/winston).
- Include requestId, userId, route, latency, status.
- Remove noisy debug logs in production.

### 7) Integration tests
- Cover register/login/create/redirect/analytics happy path.
- Cover invalid input, unauthorized, not-found, conflict.

### 8) Rate limiter + abuse controls
- Redis-backed limits by IP/user.
- Different quotas per route.
- Alerting for abuse spikes.

### 9) Health/readiness + graceful shutdown
- `/healthz` for liveness, `/readyz` for dependency readiness.
- SIGTERM drain inflight, close DB/cache.

### 10) Analytics redesign
- Queue click events.
- Worker aggregates by hour/day.
- API serves aggregates with optional raw drill-down.

---

## Interview Follow-up Angles: What to always include

1. Clear assumptions and constraints.
2. Trade-offs (latency vs consistency vs cost).
3. Failure modes and rollback.
4. Security and abuse prevention.
5. Metrics to prove improvement.
