import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";

export const gather = () => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;

    const gatherResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/gathering', {
        params: {
            path: {name: config.name}
        },
    }))
    if (gatherResponse.data) {
        yield* cooldown(gatherResponse.data.data.cooldown);
        return gatherResponse.data.data;
    }
    yield* Effect.fail(new ArtifactError(gatherResponse.error?.error?.message))

})
