import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";

export const rest = () => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const restResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/rest', {
        params: {
            path: {name: config.name}
        },
    }))
    if (restResponse.data) {
        yield* cooldown(restResponse.data.data.cooldown)
        return restResponse.data.data
    }
    yield* Effect.fail(new ArtifactError(restResponse.error?.error?.message))
})
