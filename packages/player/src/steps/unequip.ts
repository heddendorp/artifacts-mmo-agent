import type { components } from "artifact-api/schema";
import { Effect } from "effect";
import { ArtifactClient } from "../artifact-client.ts";
import { Config } from "../config-service.ts";
import { ArtifactError } from "../errors";
import { cooldown } from "./cooldown.ts";

export const unequip = Effect.fn("unequip")(function* (
	items: components["schemas"]["UnequipSchema"][],
) {
	const config = yield* Config;
	const client = yield* ArtifactClient;
	const unequipResponse = yield* Effect.promise(() =>
		client.POST("/my/{name}/action/unequip", {
			params: {
				path: { name: config.name },
			},
			body: items,
		}),
	);
	if (unequipResponse.data) {
		yield* cooldown(unequipResponse.data.data.cooldown);
		return unequipResponse.data.data;
	}
	return yield* new ArtifactError({
		message:
			unequipResponse.error?.error?.message ??
			"Artifacts API unequip request failed",
	});
});
