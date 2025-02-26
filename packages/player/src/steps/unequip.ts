import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";
import type {components} from "artifact-api/schema";

export const unequip = (body: components["schemas"]["UnequipSchema"]) => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const unequipResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/unequip', {
        params: {
            path: {name: config.name}
        },
        body
    }))
    if (unequipResponse.data) {
        yield* cooldown(unequipResponse.data.data.cooldown)
        return unequipResponse.data.data;
    }
    yield* Effect.fail(new ArtifactError(unequipResponse.error?.error?.message))
})
