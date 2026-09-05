<!-- Sync Impact Report
Version change: none (initial ratification) → 1.0.0
Modified principles: none (first adoption of Lockr Vault principles)
Added sections: Specification Structure, Development Lifecycle, Security and Cryptography, The Safe, Testing and Compliance, Repository Governance
Removed sections: none
Follow-up TODOs: none
-->
# Lockr Vault Constitution

## Preamble

We, the developers of Lockr Vault, establish this Constitution to guarantee that the
software is secure by design, verifiable by specification, and bulletproof against the
chaos of traditional development. Code is merely a means; the Specification is the Truth.

---

## Core Principles

### I. Specification First (Spec-First)

No line of code will be written, and no Git branch will be created, without a formal,
approved specification in place (via GitHub Spec Kit, the `/speckit.*` flow) describing the
expected behavior. Code is the implementation of the specification, never the other way
around. No approved spec, no implementation.

### II. Behavioral Immutability

Once a specification is approved and versioned, its behavior is law. If the code does not
satisfy the specification, the code is broken (never the other way around). If new behavior
is needed, a new version of the specification is created.

### III. Zero Trust in Human Memory

Neither the developer nor the reviewer will rely on "how they think it works". Every flow
(save, load, encrypt, export) must be documented in the specification and validated against
it automatically. Edge cases (corruption, malformed data, missing preferences) are first-class
citizens of every feature spec.

### IV. Security by Design (Zero-Knowledge)

Lockr Vault is a password manager: security is the primary functional requirement, not an
accessory constraint. Every design decision (algorithms, formats, messages, storage) is first
evaluated against its impact on the user's secret. When in doubt, choose the more conservative
option. The Master Password and derived keys NEVER leave the client device.

### V. Automated Verifiability (The Spec is the Tribunal)

100% of the scenarios and acceptance criteria defined in the specification MUST have a
corresponding automated test (unit and integration). Code coverage (lines) MUST be > 90%;
specification coverage (scenarios) MUST be 100%. Malformed data must never crash the
application. Lint, typecheck, and the full test suite MUST be green locally before any PR is
opened.

---

## Specification Structure (The Legal Body)

Every specification in this project MUST contain the following mandatory blocks:

### The Data Contract (JSON Schema)

- Defined in JSON Schema under the feature's `contracts/` directory.
- Describes the exact structure of the data the feature handles (e.g. theme preference, and
  later vault Item, Credential, Card, Secure Note, Alias).
- Example: An Item MUST have an `id` (UUID), `name` (string), and `created_at` (timestamp).

### The Behavior Scenarios (Features)

- Documented as Requirements and Acceptance Criteria in the feature's `spec.md` (GitHub Spec
  Kit flow).
- Cover ALL happy paths and unhappy paths (errors, corruption, malformed input).
- Example: Given I have a master vault, When I enter the wrong password 3 times, Then the vault
  locks for 5 minutes.

### The Performance Thresholds (Technical SLAs)

- Maximum execution times encoded as acceptance criteria.
- Example: Theme switching MUST complete in under 100ms on standard hardware.

---

## Development Lifecycle (The Legislative Process)

Any feature will strictly follow this cycle (GitHub Spec Kit flow):

1. **Drafting the Law** (`/speckit.specify`): write or update the feature specification under
   `specs/<feature>/` (Requirements + Acceptance Criteria). The data contract lives in JSON
   Schema.
2. **Reviewing the Law** (`/speckit.clarify`, `/speckit.checklist`): review the logic of the
   specification, not the code. Is it secure? Does it cover every edge case?
3. **Planning** (`/speckit.plan`, `/speckit.tasks`): design the technical solution and break it
   into ordered tasks. `/speckit.analyze` validates consistency before implementation.
4. **Freeze**: the approved specification is the immutable reference for the feature.
5. **Forced Implementation** (`/speckit.implement`): write the minimal code needed to satisfy
   the specification.
6. **Automated Validation** (`/speckit.converge` + tests): verify the code against the
   specification. If anything is missing, retry; if tests fail, the change is not accepted.

Branching: feature work happens on short-lived branches (`feature/NNN-<slug>`) created from
`main`. Tooling, environment, and process/setup changes go on their own `chore/*` branches and
MUST NOT be mixed into feature commits. Merging to `main` requires PR + review + green local
gates.

---

## Security and Cryptography (Ironclad Clauses)

- **The Official Algorithm**: The official symmetric cipher for the vault is **AES-256-GCM**.
  The mandatory key derivation function (KDF) is **Argon2id** (with configurable memory and
  time parameters). Obsolete ciphers are not acceptable (no AES-CBC, no DES, no MD5).
- **The "Zero-Knowledge in Code" Rule**: It is strictly forbidden to store in a variable or log
  the Master Password in plaintext in any execution thread. The master password MUST only exist
  in volatile memory for the few milliseconds needed to derive the key, and MUST be overwritten
  (zeroed) immediately afterwards.
- **Error Obfuscation**: Every error event MUST return generic messages ("Authentication error")
  and NOT specific messages ("Wrong password" vs "User does not exist") to prevent user
  enumeration attacks.
- **Threat Model in the Spec**: Any feature touching cryptography or authentication MUST
  explicitly document the threat model and the brute-force/corruption cases in its
  specification.
- **Non-sensitive preferences** (e.g. theme) may use plain device storage; they never carry
  secret material and MUST NOT leak into encrypted payloads or server storage.

---

## The Database (The Safe)

- **Source of truth (web-first)**: The vault is a single encrypted blob (JSON or Protocol
  Buffers format). Its authoritative copy lives in Supabase; the client keeps an encrypted local
  mirror (IndexedDB) so the app opens and edits offline-first. This architecture will also serve
  future mobile clients, which is why cloud sync is mandatory.
- **Server contract (zero-knowledge)**: The server stores ONLY the encrypted blob plus
  non-sensitive metadata: vault id, ciphertext version, Argon2id parameters (salt, iterations,
  memory, parallelism), and checksums. The Master Password and the derived key NEVER leave the
  client.
- **Cloud sync**: Mandatory from the MVP. Synchronization transfers only E2E-encrypted bytes and
  resolves conflicts against the checksummed version. The sync layer MUST NOT weaken any of the
  cryptography clauses.
- **User identity**: Supabase Auth provides identity (e.g. email/OTP) and is decoupled from the
  vault secret: a valid session never implies knowledge of the Master Password. Auth failures use
  generic error messages (see Security clauses).
- **Referential Integrity**: Each item inside the vault has an individual checksum. If, on
  opening the vault, an item does not match its checksum, the specification orders rejecting the
  entire blob and notifying the user (never returning partially corrupted data).
- **Out of scope for foundation features**: The bootstrap features (toolchain, theme, shell,
  e2e) do not touch the vault blob, cryptography, or Supabase. Those clauses become binding when
  the first vault-related feature is specified.

---

## Testing and Compliance (The Supreme Court)

- **Mandatory Coverage**: 100% of the scenarios written in the specification MUST have a
  corresponding automated test. Code coverage (lines) MUST be > 90%; specification coverage
  (scenarios) MUST be 100%.
- **Fuzzing Tests**: The test suite MUST include a module that injects random and malformed data
  into API inputs to verify that the specification (and the code) handles corruption without
  crashing.
- **Local Gates**: Before each PR/merge, lint, typecheck, and the full suite run and MUST be
  green locally. Wiring these into a hosted CI pipeline is a tooling feature to be scheduled,
  not a prerequisite for the bootstrap features.
- **Accessibility**: UI MUST pass WCAG AA and be AXE-clean in every supported theme.

---

## Repository Governance

### Folder Structure (adapted to an Angular SPA)

- `/specs/` <- THE LAW. Each feature's spec artifacts (`spec.md`, `plan.md`, `tasks.md`) and
  JSON Schemas.
- `/src/` <- The code (mere implementation). Unit tests live colocated with the code they
  test (`*.spec.ts`).
- `/e2e/` <- Browser end-to-end tests (Playwright), covering complete user flows.
- `/docs/` <- User documentation (generated from the specs) when it exists.

### Versioning Rules

- The only integration branch is `main`. It requires PR + review + green local gates.
- Constitution version bumps follow semver: MAJOR if a principle is removed or redefined;
  MINOR if a section or principle is added; PATCH for clarifications and wording fixes.

---

## Governance

This Constitution SUPERSEDES any other unwritten practice, convention, or development routine.
Every specification, plan, task, PR, and review must declare and verify compliance with the
principles established here.

- **Amendment procedure**: any change is proposed as a diff to this Constitution, the
  justification is documented (what changes, why), it is approved by review, and recorded with a
  semver version bump.
- **Compliance review**: `/speckit.converge`, requirements checklists, and local gates are the
  enforcement mechanisms. If an artifact contradicts this document, the Constitution wins and the
  artifact must be corrected.
- **Runtime development guidance**: operational Angular/TypeScript rules live in `AGENTS.md`;
  the Constitution prevails in case of conflict.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05