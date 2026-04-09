
<!--
Sync Impact Report
Version change: (none) → 1.0.0
Modified principles: all placeholders → Choreography-specific
Added sections: All (fully instantiated)
Removed sections: None
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: None (all placeholders resolved)
-->

# Choreography Constitution

Choreography is an open-source web application for families to manage chores, rewards, coins, and leaderboards in a fun, family-centered way. The project is self-hostable by design, with SvelteKit as the primary implementation framework.

## Core Principles

### I. Family-Centered Product Slices
Every feature MUST map to a real family workflow for parents, kids, or both. Every specification MUST define independently testable user stories that can be delivered incrementally. Avoid shipping technical infrastructure without a clearly linked user outcome. Rationale: This ensures all work delivers value to real users and supports incremental, testable progress.

### II. Self-Hostable and Open by Default
Core product functionality MUST work in a self-hosted deployment. Hosted-only features MAY exist only if they are optional and do not block self-hosted users from the main product value. Prefer architectures, dependencies, and operational choices that are realistic for open-source contributors and self-hosters. Rationale: This maximizes accessibility and sustainability for all users.

### III. Privacy and Parent Control First
Data collection MUST be minimal and purpose-driven. The system MUST NOT send personal family data to third-party analytics platforms by default. Parent-controlled permissions and visibility boundaries MUST be explicit in product behavior. Families MUST be able to export and delete their data. Avoid collecting precise location or unnecessary profile data. Rationale: Protects family privacy and empowers parents.

### IV. Test-First, Correct, Accessible Delivery
Work MUST start with specification before implementation. Tests MUST be written before feature code for acceptance-critical behavior. Acceptance criteria MUST be covered by automated tests before a feature is considered done. Basic accessibility validation is required for shipped user-facing flows. Reliability and correctness matter more than shipping broad but weakly validated behavior. Rationale: Ensures quality, safety, and inclusivity.

### V. Observable Simplicity
Prefer the simplest SvelteKit architecture that satisfies the current need. Avoid unnecessary services, abstractions, or infrastructure until justified by real product pressure. Features with operational risk or user-impacting workflows MUST include structured logging and/or monitoring hooks as appropriate. Documentation and quickstart guidance MUST be updated when behavior changes. Rationale: Keeps the project maintainable and debuggable for all contributors.

## Additional Technical and Product Constraints

- Default architecture is a single SvelteKit application unless a more complex topology is justified.
- The project is open source and must remain friendly to contributors.
- Self-hosting is a first-class concern for all core features.
- Optional hosted-only enhancements are allowed, but must remain clearly optional and not degrade the self-hosted experience.
- Do not add unnecessary personal-data collection at any layer.

## Development Workflow and Quality Gates

- All work MUST begin with a written specification before implementation.
- Features MUST be delivered as independent user-story slices.
- Tests for acceptance criteria MUST be written before implementation.
- A feature is not done until:
	- Automated acceptance coverage exists
	- Accessibility is checked at a basic level
	- Relevant observability (logging/monitoring) is added
	- Documentation and quickstart are updated when behavior changes

## Governance

This is the initial constitution for the Choreography project. Amendments are approved by the project maintainer and MUST include a written rationale. Constitution changes use semantic versioning:
- MAJOR: Principle removals or breaking governance changes
- MINOR: New principles or materially expanded requirements
- PATCH: Clarifications and wording-only refinements

This constitution supersedes all other practices. All PRs and reviews must verify compliance with these principles and gates.

**Version**: 1.0.0 | **Ratified**: 2026-04-08 | **Last Amended**: 2026-04-08
