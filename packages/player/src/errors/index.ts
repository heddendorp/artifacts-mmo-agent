import { Schema } from "effect";

export class AlreadyAtDestinationError extends Schema.TaggedErrorClass<AlreadyAtDestinationError>()(
	"AlreadyAtDestinationError",
	{},
) {}

export class ArtifactError extends Schema.TaggedErrorClass<ArtifactError>()(
	"ArtifactError",
	{ message: Schema.String },
) {}
