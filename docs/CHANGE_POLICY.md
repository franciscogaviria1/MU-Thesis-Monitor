# Change Policy

## Principle

Documentation is guidance, not a prison. Codex and future contributors may improve the architecture, implementation, data flow, testing, and UI when evidence shows a clearer, safer, or more maintainable approach.

Improvement does not permit silent weakening of:

- governance;
- auditability;
- evidence requirements;
- source traceability;
- deterministic scoring;
- user safety.

## Change Classes

### Routine Changes

Refactoring, wording corrections, visual polish, and maintenance may proceed when they preserve behavior and policy. They still require appropriate verification.

### Material Changes

A change is material when it affects:

- scoring inputs, weights, formulas, or confidence;
- source tiers, eligibility, or freshness;
- decision labels, thresholds, or precedence;
- AI permissions, prompts, schemas, or evidence handling;
- audit history, manual overrides, or traceability;
- user-facing safety language or interpretation;
- architecture boundaries or data ownership.

## Requirements for Material Changes

Every material change must:

1. Explain why the change is needed, including the evidence, limitation, or risk being addressed.
2. Update all affected documentation before or with implementation.
3. Add or update tests when logic or behavior changes.
4. Log the decision in `docs/DECISION_LOG.md`.

The decision-log entry must record the date, decision, rationale, alternatives considered, affected policies or components, expected impact, migration needs, and author or agent. If `docs/DECISION_LOG.md` does not yet exist, creating it is a prerequisite of the first material implementation change.

## Contributor Responsibilities

Codex and contributors may challenge existing assumptions and recommend better approaches. They must:

- distinguish defects, improvements, and policy changes;
- prefer the smallest coherent change that solves the problem;
- preserve existing evidence and historical results;
- version changed rules and apply them prospectively unless a documented correction requires recalculation;
- disclose tradeoffs, unresolved risks, and verification performed;
- avoid combining cleanup with an unrelated material policy change.

When documentation conflicts, governance and user-safety constraints take precedence until the conflict is explicitly resolved and logged.

## Prohibited Changes

Contributors must not:

- hide a policy change inside a refactor or UI update;
- allow AI to become the authority for scores or decision labels;
- reduce source or evidence requirements merely to avoid `Insufficient Evidence`;
- rewrite history without retaining prior evidence, rules, and results;
- make a review label appear to be a trading instruction;
- bypass required tests or decision logging for convenience.

## Review Standard

A material change is complete only when its rationale, documentation, tests, migration impact, and decision-log entry agree. Review should confirm that the change improves the system without reducing explainability, reproducibility, or user control.
