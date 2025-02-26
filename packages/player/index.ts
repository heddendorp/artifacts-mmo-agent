import {BunContext, BunRuntime} from "@effect/platform-bun";
import {program} from "./src/program.ts";
import {Effect} from "effect";
import {Config} from "./src/config-service.ts";
import {ArtifactClient} from "./src/artifact-client.ts";
import {artifactClient} from "artifact-api";

const name = 'Lukas'


BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer), Effect.provideService(Config, {name: 'Lukas'}), Effect.provideService(ArtifactClient, artifactClient)))
