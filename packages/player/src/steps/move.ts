import {Effect} from "effect";
import {Config} from "../config-service.ts";
import {ArtifactClient} from "../artifact-client.ts";
import {AlreadyAtDestinationError, ArtifactError} from "../errors";
import {cooldown} from "./cooldown.ts";

export const move = (coordinates: { x: number, y: number }) => Effect.gen(function* () {
    const config = yield* Config;
    const client = yield* ArtifactClient;
    const {data, error} = yield* Effect.promise(() => client.POST('/my/{name}/action/move', {
        params: {
            path: {name: config.name}
        },
        body: coordinates
    }))
    if (data) {
        yield* cooldown(data.data.cooldown)
        return data.data
    } else {
        switch (error?.error?.code) {
            case 490:
                yield* Effect.fail(new AlreadyAtDestinationError());
                break;
            default:
                yield* Effect.fail(new ArtifactError(error.error?.message))
        }
    }
})
