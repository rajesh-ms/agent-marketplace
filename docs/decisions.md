# Decisions

## 1. In-memory registry for issue scope

The registry stores agent cards in a process-local `Map` keyed by normalized `name@@version`.

Why:
- It keeps the implementation small and fully working for the issue scope.
- It lets the API, validation, lifecycle rules, and orchestration lookup behavior be exercised without introducing database setup.

Alternatives considered:
- SQLite or Postgres-backed persistence.
- A repository abstraction with a stub implementation.

Why those were not chosen:
- Persistent storage would add migration and operational work that is not required by the acceptance criteria.
- A repository abstraction without a real second implementation would increase indirection without practical benefit for this issue.

## 2. Thin HTTP layer, domain-owned rules

`src/server.ts` only parses HTTP input and maps errors. `src/agent-registry.ts` owns validation, authorization, heartbeat updates, discovery, and runtime resolution.

Why:
- Registry behavior is easier to test directly without going through HTTP for every case.
- Authorization and lifecycle rules stay consistent across search, direct reads, overview, and runtime resolution.

Alternatives considered:
- Embedding most behavior in route handlers.
- Using a framework with middleware and controller layers.

Why those were not chosen:
- Route-centric logic would duplicate checks and make regressions more likely.
- A framework would add dependencies and boilerplate without changing the core issue outcome.

## 3. Access policies expressed as viewer and invoker principal lists

Each agent card declares `accessPolicy.viewers` and `accessPolicy.invokers`. The wildcard `*` is treated as public access for that action.

Why:
- It directly matches the acceptance requirement that metadata defines who can see and use each agent.
- It supports public discovery without also making runtime invocation public.

Alternatives considered:
- A single ACL shared for all actions.
- A separate visibility enum plus separate ACLs.

Why those were not chosen:
- A single ACL cannot represent "discoverable but not invokable" agents.
- A separate visibility enum can be useful later, but the wildcard viewer policy already covers the required semantics with less surface area.

## 4. Runtime resolution excludes inactive and deprecated versions

`resolve()` filters out inactive and deprecated records and returns the latest authorized version by semantic-ish version comparison.

Why:
- Clients resolving an agent name need a callable endpoint, not just any registered record.
- This integrates the registry with an orchestration layer by turning logical agent identity into runtime config safely.

Alternatives considered:
- Returning the latest version even if inactive or deprecated.
- Failing on multiple versions unless the caller specifies one.

Why those were not chosen:
- Returning non-callable versions would violate the runtime resolution intent.
- Requiring an explicit version would make orchestration harder and remove the benefit of centralized lifecycle control.

## 5. Strict validation for pagination, lifecycle state, and timestamps

The service rejects malformed `page`, `pageSize`, lifecycle `status`, and non-string or non-ISO heartbeat timestamps.

Why:
- These fields drive filtering and operational freshness, so weak coercion would create ambiguous behavior.
- Rejecting bad inputs early produces stable API semantics and simpler downstream logic.

Alternatives considered:
- Best-effort coercion for query values and timestamps.
- Accepting any `Date.parse()` compatible string.

Why those were not chosen:
- Silent coercion hides client bugs.
- Loose date parsing is implementation-dependent and makes heartbeat freshness less reliable.
