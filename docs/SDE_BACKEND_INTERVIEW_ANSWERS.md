# SDE Backend Interview Model Answers (Easy → Hard)

These are **study-ready model answers** for the URL shortener project (Node.js + Express + MongoDB + JWT + EJS). Use each answer in two formats:
- **Interview short answer** (30-60 seconds)
- **Deep answer** (2-5 minutes with trade-offs)

---

## Easy Level (Foundations)

### 1) Role of Express and route organization
Express is the HTTP framework that handles routing, middleware chaining, request parsing, and response handling. In this project, `index.js` wires global middleware and mounts route modules, while route files map URL paths to controller functions.

### 2) `app.use('/url', ...)` vs `router.get('/:shortID', ...)`
`app.use('/url', router)` mounts a router on a base path; every route in that router is prefixed with `/url`. `router.get('/:shortID')` defines a specific GET endpoint with a path parameter inside a router.

### 3) Request lifecycle for short URL creation
Client sends `POST /url` with original URL → middleware parses body and auth (if protected) → controller validates input → service/model generates `shortId` and saves document in MongoDB → server responds with short URL payload or rendered page.

### 4) Why `express.json()` and `express.urlencoded()`
`express.json()` parses JSON request bodies (API clients). `express.urlencoded()` parses HTML form submissions (`application/x-www-form-urlencoded`) used by server-rendered forms.

### 5) What `cookie-parser` does
It parses the `Cookie` header and populates `req.cookies`, enabling auth middleware to read JWT/session cookies safely and consistently.

### 6) Why Mongoose over raw MongoDB driver
Mongoose adds schemas, validation, hooks, defaults, indexing declarations, model abstraction, and cleaner query APIs. It improves consistency and developer speed versus ad-hoc raw collection access.

### 7) Purpose of `shortId`
`shortId` is the public compact identifier used in redirect links (`/abc123xy`) to map users from short URL to original long URL.

### 8) Why `shortId` should be unique
If two records share the same code, redirect behavior becomes ambiguous/incorrect. A unique index enforces data integrity under concurrency.

### 9) `timestamps: true`
Automatically adds and maintains `createdAt` and `updatedAt`, useful for auditing, sorting, retention, analytics windows, and debugging.

### 10) Why `nanoid(8)` vs sequential ID
Random IDs reduce enumeration risk and make link guessing harder. Sequential IDs are predictable and easier to scrape/abuse.

### 11) Controllers vs route files
Routes define endpoint-to-handler mapping and middleware order. Controllers contain request handling logic, validation, DB calls, and response formatting.

### 12) `res.render` vs `res.json`
`res.render` returns server-generated HTML (EJS views). `res.json` returns machine-readable JSON for APIs/clients.

### 13) Status code when short URL not found
Use `404 Not Found` because resource mapping for that short code does not exist.

### 14) Why validate login/register body
To prevent invalid/missing fields, reduce security risks, return predictable errors, and avoid passing unsafe input to DB/auth logic.

### 15) JWT stateless auth high level
Server signs token with user claims; client stores token (cookie/header); each request presents token; server verifies signature and trustably reconstructs user identity without session lookup (unless revocation is required).

---

## Easy-Medium Level (Practical Backend Basics)

### 16) Login flow (`POST /user/login` to cookie)
Receive email/password → find user → verify password (should be bcrypt compare) → sign JWT with user id/role/expiry → set cookie with secure flags → return success.

### 17) How `checkforAuthentication` attaches user context
Middleware reads token from cookie/header, verifies signature, decodes claims, then attaches normalized user info (e.g., `req.user`) for downstream authorization and business logic.

### 18) What `restrictedTologin(["NORMAL"])` enforces
It is role-based authorization: only authenticated users with role `NORMAL` pass; others receive 401/403.

### 19) If auth middleware runs before `cookie-parser`
`req.cookies` is undefined/empty, token lookup fails, users appear unauthenticated, and protected routes break unexpectedly.

### 20) Why plaintext passwords are risky + fix
Plaintext exposure leads to account takeover across services. Fix using bcrypt/argon2 hashing + per-password salt, optional pepper, strong password policy, and staged migration for old records.

### 21) Purpose of `httpOnly`
Prevents JavaScript access to cookies, reducing token theft via XSS.

### 22) `secure` and `sameSite`
- `secure`: cookie only over HTTPS.
- `sameSite`: limits cross-site sending (`Lax`, `Strict`, `None`).
Use `secure=true` in production; set `sameSite` based on frontend deployment and CSRF model.

### 23) Why secrets in env vars
Avoid hardcoding sensitive config in code history, allow environment-specific values, and enable secure secret rotation.

### 24) Risk of inconsistent role names
Authorization bypass/denial bugs happen when token claim and DB role don't match expected constants (`NORMAL` vs `NORMAL_USER`).

### 25) Why URL input validation is critical
Prevents invalid redirects, security abuse (javascript/data schemes), broken analytics, and poor UX.

### 26) Validate only HTTP/HTTPS URLs
Parse with `new URL(input)`; allow only `http:`/`https:` protocols; optionally restrict hostname rules and reject local/private network targets.

### 27) Open redirect risk
Attackers can shorten malicious phishing links, abusing your trusted domain to trick users.

### 28) Too many `console.log` in production
Creates noisy logs, performance overhead, sensitive data leaks, and poor observability quality.

### 29) Standard API error response
Use consistent envelope: `{ success:false, code:"VALIDATION_ERROR", message:"...", details:[...], requestId:"..." }`.

### 30) Why naming consistency matters
Reduces logic bugs, eases onboarding, improves readability, and prevents auth/data mismatches across layers.

---

## Medium Level (Reliability, Data, API Design)

### 31) `findOne` vs `updateOne` vs `findOneAndUpdate`
- `findOne`: read a single document.
- `updateOne`: update without returning updated doc by default.
- `findOneAndUpdate`: atomic find+update and can return modified document.
Useful for counters and avoiding race-prone read-modify-write flows.

### 32) Where double increment can happen
If multiple redirect handlers each increment click counters for same visit path, one user click may count twice, corrupting analytics and business reporting.

### 33) Make click increment idempotent per request
Use one canonical redirect endpoint; optionally attach request-id/idempotency key and dedupe writes in a short TTL store before increment.

### 34) High-traffic indexes
Unique index on `shortId`, index on `createdBy`, and time-based/compound indexes for analytics queries (`shortId + timestamp` or aggregation collection indexes).

### 35) Why unbounded `totalClicksHistory` is bad
Document size grows indefinitely, increases read/write cost, risks MongoDB document limits, and hurts cache/storage efficiency.

### 36) Analytics redesign (raw vs aggregates)
Store raw click events in append-only store (or queue→event collection) and maintain pre-aggregated counters (daily/hourly). Query aggregates for dashboards; keep raw data for forensic/advanced analytics with retention.

### 37) Pagination for user URL list
Use cursor-based pagination (`createdAt`, `_id`) for scale stability; offset pagination is simpler but degrades on large data.

### 38) Embedding vs separate collection
Embedding is simple and fast for small bounded data; separate collection scales better, avoids oversized documents, and supports flexible analytics queries.

### 39) Endpoint for day/week/month analytics
`GET /url/:shortId/analytics?granularity=day&from=...&to=...` returning time buckets + totals + unique counts, with validated ranges and capped window size.

### 40) Ensure short-code uniqueness under concurrency
Use DB unique index + retry-on-conflict generation loop. Never rely solely on app-level pre-check.

### 41) Support custom aliases safely
Validate alias pattern, reserve blocked keywords, enforce unique index, and return 409 on conflict.

### 42) API versioning (`/api/v1`)
Namespace routes by version and freeze contracts. Add new behavior in `/v2` while maintaining v1 until deprecation period ends.

### 43) Backward compatibility concerns
Field removals/renames, type changes, status code changes, and auth behavior shifts can break clients silently.

### 44) DTO/validation structure in Express
Create request schemas (Joi/Zod), run validation middleware before controllers, transform to typed DTO, then pass sanitized data to service layer.

### 45) Global error handling
Use centralized error middleware that maps known errors to safe client messages, hides internals, logs stack traces with requestId, and always sends consistent envelope.

### 46) Centralized logging with correlation IDs
Generate/propagate `x-request-id`, include it in all logs/metrics/traces so one request can be followed across middleware/services.

### 47) `/healthz` and `/readyz`
- `/healthz`: process alive (liveness).
- `/readyz`: dependencies ready (DB/cache/queue connectivity + critical config loaded).

### 48) Graceful shutdown for Node + MongoDB
Handle SIGTERM, stop accepting new connections, allow in-flight requests to finish with timeout, close DB/cache clients, then exit.

### 49) What to cache and where
Cache `shortId -> redirectURL` and hot metadata. In-memory cache works for single node; Redis is preferred for multi-node consistency and shared hot keys.

### 50) Prevent cache stampede
Use single-flight locking, stale-while-revalidate, request coalescing, and jittered TTLs.

---

## Medium-Hard Level (Security + Distributed Systems)

### 51) Rate limiting for create/redirect/login
Apply route-specific limits (IP + user key), stricter on login/create, relaxed token-bucket for redirect; enforce via Redis-backed limiter for distributed nodes.

### 52) Protect login from brute force
Rate limits + progressive backoff + temporary lock + CAPTCHA after threshold + alerting.

### 53) JWT revocation strategies
Short-lived access tokens + refresh rotation, token version in DB, denylist for emergency revocation, and key rotation for broad invalidation.

### 54) When to choose opaque sessions over JWT
Choose sessions when immediate revocation, server-side control, and simpler security posture matter more than stateless scaling.

### 55) CSRF: cookie auth vs bearer token
Cookie auth is CSRF-prone by default and needs sameSite + CSRF token defenses. Bearer token in Authorization header is less CSRF-prone but must protect against XSS/token leakage.

### 56) Secure admin routes + audit
Enforce RBAC checks, MFA for admin login, IP restrictions (if applicable), immutable audit logs for every privileged action.

### 57) Domain allow/deny lists
Normalize domains, validate against threat feeds/denylist, optionally allowlist for enterprise mode, and apply asynchronous rescans.

### 58) SSRF-like risks in URL processing
If backend fetches/expands/previews submitted URLs, attackers may target internal network endpoints. Block private IP ranges and metadata endpoints.

### 59) Helmet headers to enable
Use CSP, HSTS, X-Content-Type-Options, X-Frame-Options/Frameguard, Referrer-Policy, and disable powered-by headers to reduce attack surface.

### 60) JWT signing key rotation
Include `kid` in token header, publish key set, verify against active + previous keys during transition, then retire old keys after TTL.

### 61) Auth ↔ redirect service secure communication
Use mTLS/service identity, short-lived service tokens, least-privilege network policies, and signed internal requests.

### 62) At-least-once vs exactly-once click semantics
At-least-once is practical but may duplicate; exactly-once is expensive. Typically use at-least-once with idempotent event keys and dedupe windows.

### 63) DB unavailable during redirect failure modes
Lookup failures increase latency/errors. Mitigate with cache fallback, circuit breaker, fail-open/closed policy based on risk, and degraded metrics mode.

### 64) Block redirect on analytics write failure?
Usually no. Prioritize user redirect path; write analytics asynchronously and tolerate temporary loss with retries/dead-letter queues.

### 65) Fallback behavior for partial outages
Serve redirects from cache, queue writes for later, shed noncritical traffic, surface degraded status, and protect core path latency.

### 66) Prevent phishing/spam abuse
Threat scoring, URL reputation checks, velocity controls, abuse reporting, auto-block pipelines, and manual moderation for suspicious campaigns.

### 67) Detect bot/anomalous clicks
Use heuristics and models on IP, UA entropy, click velocity, geolocation anomalies, and referrer patterns; flag invalid traffic.

### 68) Multi-tenant isolation
Tenant ID in every record + query guardrails, per-tenant encryption keys/quotas, logical isolation; optionally dedicated infra for high-tier tenants.

### 69) Acceptable consistency model for counters
Eventual consistency is usually acceptable for analytics counters; strict consistency is rarely needed for user redirect correctness.

### 70) Transactions vs eventual consistency
Use transactions only when cross-document invariants are critical. Prefer eventual consistency for high-throughput analytics where slight lag is acceptable.

---

## Hard Level (System Design + Production Leadership)

### 71) Design for 100M redirects/day
Edge CDN + global LB → stateless redirect API pods → Redis cache (hot shortId mappings) → MongoDB for source of truth. Async pipeline (queue + workers) for click analytics aggregation.

### 72) 1-year analytics storage estimate
Start with assumptions (events/day, bytes/event, replication factor, index overhead). Calculate raw size, then add 2-4x overhead for indexes/replication/compression margins.

### 73) Redis + Mongo read/write path
Read: check Redis → miss fetch Mongo → set Redis TTL. Write: persist Mongo first, then cache write-through/invalidate. Use negative caching for unknown IDs.

### 74) Mongo sharding strategy
Hash shard key on `shortId` for uniform distribution and write/read balance. Add secondary indexes for tenant/user queries; avoid hot ranges with monotonically increasing keys.

### 75) Multi-region traffic handling
Route users to nearest region for low latency; replicate critical datasets; choose active-active for reads with controlled write ownership or conflict strategy.

### 76) Replication and failover strategy
Use replica sets per region and cross-region disaster replicas. Automate failover with health checks and DNS/traffic manager updates.

### 77) Migration to aggregation schema
Dual-write events + old path, backfill historical data, validate parity dashboards, then cut over reads and deprecate legacy fields.

### 78) Zero-downtime deployments
Use rolling/blue-green deploys, readiness probes, backward-compatible DB migrations, feature flags, and instant rollback strategy.

### 79) SLOs/SLIs
Define redirect availability (e.g., 99.95%), latency SLI (p95/p99), and error budget policies driving release velocity and incident priorities.

### 80) Dashboards and alerts
Build service-level and dependency-level dashboards; alert on symptom + cause metrics (5xx, latency, cache miss spikes, DB saturation, queue lag).

### 81) Incident response for sudden 5xx spike
Trigger incident, stabilize (rollback/traffic shift/rate limit), identify blast radius, inspect recent deploy and dependency health, communicate updates, run postmortem.

### 82) Load tests and capacity planning
Run baseline, stress, and soak tests with realistic traffic distribution (hot keys, burstiness). Derive scaling curves and safe headroom targets.

### 83) Secure secrets/config in CI/CD/runtime
Use secret manager (Vault/SSM/KMS), short-lived credentials, least privilege IAM, no secrets in logs/images, and automated rotation.

### 84) Blue-green/canary for auth changes
Ship behind feature flag, canary by traffic slice/tenant cohort, monitor auth failures and latency, expand gradually with rollback guardrails.

### 85) Prove backward compatibility in API refactors
Contract tests, schema diff checks, consumer-driven tests, versioned OpenAPI specs, and parallel run comparison.

### 86) Distinguish app bugs vs infra issues
Use RED + USE metrics, traces, DB connection errors, network timeout signatures, dependency saturation, and error pattern clustering.

### 87) DR design and testing (RPO/RTO)
Define target data loss/recovery time, implement backups + cross-region replication, run periodic restore drills and failover game days.

### 88) Prevent one hot URL overload
Edge caching/CDN, per-key rate shaping, request collapsing, hot-key sharding techniques, and dedicated cache policy for viral keys.

### 89) Cost-efficient long-term archival
Keep recent aggregates in hot store, move old raw events to cheap object storage (partitioned + compressed), query via batch engines when needed.

### 90) Evolve monolith to services safely
Extract by business capability with clear boundaries, keep contract stability, invest in observability/platform tooling first, and avoid premature fragmentation.

---

## Code-Specific Deep-Dive Prompt Answering Strategy

1. **bcrypt migration**: support legacy password check once, rehash on successful login.
2. **redirect double-count fix**: one redirect endpoint + one atomic increment.
3. **validation middleware**: centralized schemas for `/user`, `/user/login`, `/url`.
4. **env config**: single config module + startup validation fail-fast.
5. **role constants**: shared enum used in model, token, and middleware.
6. **structured logger**: JSON logs with level, requestId, userId, route.
7. **integration tests**: happy + failure flows using isolated test DB.
8. **rate limiting**: per-IP and per-user quotas with Redis store.
9. **health/readiness + shutdown**: kube-friendly probes + SIGTERM handling.
10. **analytics redesign**: async event ingestion + aggregate materialization.

---

## Interviewer Follow-up Angles: How to answer strongly

- Always state **assumptions** first.
- Mention **trade-offs** explicitly.
- Cover **failure modes** and **rollback**.
- Add at least one **metric/SLI** to prove success.
- Tie the answer to this project’s current code limitations.
