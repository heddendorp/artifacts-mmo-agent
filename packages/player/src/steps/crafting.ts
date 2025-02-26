import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";
import type {components} from "artifact-api/schema";

export const crafting = (body: components["schemas"]["CraftingSchema"]) => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const craftingResponse = yield* Effect.promise(() => client.POST('/my/{name}/action/crafting', {
        params: {
            path: {name: config.name}
        },
        body
    }))
    if (craftingResponse.data) {
        yield* cooldown(craftingResponse.data.data.cooldown)
        return craftingResponse.data.data;
    }
    yield* Effect.fail(new ArtifactError(craftingResponse.error?.error?.message))
})
