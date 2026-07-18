# AGENTS.md

## Project intent

This is a personal prototype for automating characters in Artifacts MMO. Keep it
small and direct. Hard-coded experiments, incomplete entry points, and minimal
tooling are acceptable unless the current task specifically asks to improve
them. Do not turn ordinary changes into a production-readiness project.

Artifacts is an asynchronous API-based MMORPG. An account can control up to
five characters, and character actions have cooldowns. Authenticated calls act
on the live game account associated with the token.

Official references:

- API reference: https://api.artifactsmmo.com/docs/#/
- Getting started: https://docs.artifactsmmo.com/getting-started/
- Live OpenAPI document: https://api.artifactsmmo.com/openapi.json
- Game client and interactive tutorial: https://play.artifactsmmo.com/

Prefer these sources over assumptions about game rules or endpoint behavior.

## Repository map

This is a Bun/TypeScript workspace with three packages:

- `packages/api`: the shared `openapi-fetch` client and generated API types.
  `ARTIFACT_TOKEN` is read here and attached as a bearer token.
- `packages/player`: deterministic automation built with Effect. Actions are
  represented as small steps that call the API and then observe the returned
  cooldown.
- `packages/agent`: experimental LangGraph/Vertex AI automation. `src/agent.ts`
  is the main ReAct experiment; `src/planner-agent.ts` is a separate
  plan/execute/replan experiment. The package-level `index.ts` is only a Bun
  placeholder.

Both runtime packages depend on the shared API package. Keep endpoint types and
authentication centralized there.

## Vendored Effect reference

The Effect monorepo is vendored as a squashed Git subtree under `repos/effect`
at `effect@4.0.0-beta.99`, matching the player package's Effect 4 dependencies.

When writing or reviewing Effect code:

1. Read `repos/effect/LLMS.md` completely before making changes.
2. Use `repos/effect/packages`, its tests, and its AI documentation as the
   source of truth for Effect 4 APIs and idioms.
3. For v3-to-v4 questions, start with `repos/effect/MIGRATION.md` and the linked
   guides under `repos/effect/migration`.
4. Treat `repos/effect` as read-only reference material. Do not edit it unless
   explicitly asked and do not import application code from it; continue using
   normal package dependencies.

When changing Effect versions, update all Effect packages to the same v4
version and update the subtree to the matching tag:

```sh
git subtree pull --prefix=repos/effect \
  https://github.com/Effect-TS/effect.git \
  'effect@<version>' --squash
```

## Setup and useful commands

Use Bun. Dependencies are workspace-managed from the repository root.

```sh
bun install
export ARTIFACT_TOKEN="..."
bun run packages/player/index.ts
bun run packages/agent/src/agent.ts
```

The agent experiment also needs working Google Cloud Application Default
Credentials for the Vertex AI project configured in its source.

Regenerate API types from the live OpenAPI document with:

```sh
cd packages/api
bun run generate
```

After changing code or regenerating types, use the available direct checks:

```sh
bunx tsc --noEmit
bunx biome check .
```

There is currently no automated test suite and no root-level run script. Do not
claim runtime verification unless the relevant entry point was actually run.
The full repository Biome check currently reports legacy formatting in
untouched files; do not turn a scoped change into a repository-wide formatting
rewrite unless requested. Still run Biome against every handwritten file you
touch.

## Live API safety

- Never commit or print `ARTIFACT_TOKEN` or Google credentials.
- Do not call authenticated endpoints during inspection, testing, or review
  unless the user explicitly authorizes live game actions.
- Public read endpoints may be used to inspect game data and server details.
- Respect the cooldown returned by every character action before issuing that
  character's next action. Different characters can act independently.
- Preserve structured API error codes where practical; they contain gameplay
  meaning such as cooldown, missing content, or invalid location.

## API compatibility note

As of 2026-07-18, the checked-in `packages/api/openapi.json` and `schema.d.ts`
are synchronized with live API version 8.1.0.

Equip and unequip actions accept arrays rather than single objects; callers in
both runtime packages must preserve that shape. Map data is layered and
supports map IDs and transitions, though moving by `x` and `y` remains
supported. The player observes the current cooldown response fields before
continuing.

When touching API integrations:

1. Check the live API reference or OpenAPI document.
2. Regenerate the schema rather than hand-editing `schema.d.ts`.
3. Review the generated diff for breaking request and response changes.
4. Update all affected callers in both `packages/player` and `packages/agent`.
5. Avoid authenticated smoke tests unless explicitly authorized.

## Code conventions

- Follow the root TypeScript and Biome configuration.
- Use generated `components` and `paths` types instead of duplicating API
  payload shapes.
- Keep game actions small and composable.
- In Effect code, obtain configuration and the API client through
  `Context.Service` and model expected failures as schema-backed tagged errors.
- In agent tools, keep tool schemas aligned with the actual parameters sent to
  the API; do not advertise filters that the implementation ignores.
- Preserve the prototype's two approaches unless a task explicitly chooses one
  or asks for consolidation.
