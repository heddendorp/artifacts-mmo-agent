import type { components } from "artifact-api/schema";
import { Effect } from "effect";
import { ArtifactClient } from "../artifact-client.ts";
import { Config } from "../config-service.ts";
import { ArtifactError } from "../errors";
import { cooldown } from "./cooldown.ts";

export const crafting = Effect.fn("crafting")(function* (
	body: components["schemas"]["CraftingSchema"],
) {
	const config = yield* Config;
	const client = yield* ArtifactClient;
	const craftingResponse = yield* Effect.promise(() =>
		client.POST("/my/{name}/action/crafting", {
			params: {
				path: { name: config.name },
			},
			body,
		}),
	);
	if (craftingResponse.data) {
		yield* cooldown(craftingResponse.data.data.cooldown);
		return craftingResponse.data.data;
	}
	return yield* new ArtifactError({
		message:
			craftingResponse.error?.error?.message ??
			"Artifacts API crafting request failed",
	});
});
