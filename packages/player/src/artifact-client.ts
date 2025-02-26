import {Context} from "effect";
import type {artifactClient} from "artifact-api";

export class ArtifactClient extends Context.Tag('ArtifactClient')<
    ArtifactClient, typeof artifactClient>() {
}
