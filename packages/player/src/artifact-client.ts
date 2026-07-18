import type { artifactClient } from "artifact-api";
import { Context } from "effect";

export class ArtifactClient extends Context.Service<
	ArtifactClient,
	typeof artifactClient
>()("ArtifactClient") {}
