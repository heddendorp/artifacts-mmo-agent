import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";

export const fight = () => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const fightResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/fight', {
        params: {
            path: {name: config.name}
        },
    }))
    if (fightResponse.data) {
        yield* cooldown(fightResponse.data.data.cooldown)
        return fightResponse.data.data;
    }
    yield* Effect.fail(new ArtifactError(fightResponse.error?.error?.message))
})
