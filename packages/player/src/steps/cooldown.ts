import {Effect} from "effect";
import type {components} from "artifact-api/schema";

export const cooldown = (cooldown: components["schemas"]["CooldownSchema"]) => Effect.gen(function* () {
    yield* Effect.log(`Waiting for ${cooldown.remaining_seconds} seconds because of ${cooldown.reason}`);
    yield* Effect.sleep(`${cooldown.remaining_seconds} seconds`);
})
