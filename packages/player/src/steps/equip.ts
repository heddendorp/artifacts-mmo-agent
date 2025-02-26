import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";
import type {components} from "artifact-api/schema";

export const equip = (body: components["schemas"]["EquipSchema"]) => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const equipResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/equip', {
        params: {
            path: {name: config.name}
        },
        body
    }))
    if (equipResponse.data) {
        yield* cooldown(equipResponse.data.data.cooldown)
        return equipResponse.data.data;
    }
    yield* Effect.fail(new ArtifactError(equipResponse.error?.error?.message))
})
