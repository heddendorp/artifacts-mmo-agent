import { Effect } from "effect";
import { ArtifactClient } from "../artifact-client.ts";
import { Config } from "../config-service.ts";
import { AlreadyAtDestinationError, ArtifactError } from "../errors";
import { cooldown } from "./cooldown.ts";

export const move = Effect.fn("move")(function* (coordinates: {
	x: number;
	y: number;
}) {
	const config = yield* Config;
	const client = yield* ArtifactClient;
	const { data, error } = yield* Effect.promise(() =>
		client.POST("/my/{name}/action/move", {
			params: {
				path: { name: config.name },
			},
			body: coordinates,
		}),
	);
	if (data) {
		yield* cooldown(data.data.cooldown);
		return data.data;
	}
	if (error?.error?.code === 490) {
		return yield* new AlreadyAtDestinationError({});
	}
	return yield* new ArtifactError({
		message: error?.error?.message ?? "Artifacts API move request failed",
	});
});
