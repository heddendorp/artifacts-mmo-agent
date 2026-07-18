import type { components } from "artifact-api/schema";
import { Effect } from "effect";

export const cooldown = Effect.fn("cooldown")(function* (
	cooldown: components["schemas"]["CooldownSchema"],
) {
	yield* Effect.log(
		`Waiting for ${cooldown.remaining_seconds} seconds because of ${cooldown.reason}`,
	);
	yield* Effect.sleep(`${cooldown.remaining_seconds} seconds`);
});
