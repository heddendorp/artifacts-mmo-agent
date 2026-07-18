import { BunRuntime } from "@effect/platform-bun";
import { artifactClient } from "artifact-api";
import { Effect } from "effect";
import { ArtifactClient } from "./src/artifact-client.ts";
import { Config } from "./src/config-service.ts";
import { program } from "./src/program.ts";

const characterNames = ["Lukas", "Sonja"] as const;

const automation = Effect.forEach(
	characterNames,
	(name) =>
		program().pipe(
			Effect.provideService(Config, { name }),
			Effect.catchCause((cause) =>
				Effect.logError("Character automation stopped", cause),
			),
			Effect.annotateLogs({ character: name }),
		),
	{ concurrency: "unbounded", discard: true },
).pipe(Effect.provideService(ArtifactClient, artifactClient));

BunRuntime.runMain(automation);
