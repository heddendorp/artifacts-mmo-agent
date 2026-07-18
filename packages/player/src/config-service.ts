import { Context } from "effect";

export class Config extends Context.Service<
	Config,
	{ readonly name: string }
>()("ConfigService") {}
