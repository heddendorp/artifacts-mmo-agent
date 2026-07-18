import { BunRuntime } from "@effect/platform-bun";
import { artifactClient } from "artifact-api";
import { Effect } from "effect";
import { ArtifactClient } from "./src/artifact-client.ts";
import { Config } from "./src/config-service.ts";
import { program } from "./src/program.ts";

BunRuntime.runMain(
	program().pipe(
		Effect.provideService(Config, { name: "Lukas" }),
		Effect.provideService(ArtifactClient, artifactClient),
	),
);
