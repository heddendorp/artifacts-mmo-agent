import { Effect, Schedule } from "effect";
import { fight } from "./steps/fight.ts";
import { move } from "./steps/move.ts";
import { rest } from "./steps/rest.ts";

export const program = Effect.fn("program")(function* () {
	yield* Effect.log("Starting program");

	yield* Effect.repeat(
		Effect.gen(function* () {
			yield* move({
				x: 0,
				y: 1,
			}).pipe(
				Effect.catchTags({
					AlreadyAtDestinationError: () => Effect.void,
				}),
			);

			yield* fight();

			yield* rest();
		}).pipe(Effect.withSpan("program.iteration")),
		Schedule.recurs(199),
	);
	//
	// const move2Response = yield* move({x:-1, y:0}).pipe(Effect.catchTags({
	//     AlreadyAtDestinationError: ()=>Effect.succeed(undefined),
	// }));
	//
	// const gatherResponse = yield* gather().pipe(Effect.repeat(Schedule.recurs(4)));
	// yield* Effect.log(gatherResponse)

	// yield* unequip([{slot: 'weapon', quantity: 1}])

	// yield* move({x:2, y:1}).pipe(Effect.catchTags({
	//     AlreadyAtDestinationError: ()=>Effect.succeed(undefined),
	// }))

	// yield* crafting({code: 'wooden_staff', quantity: 1})
	// yield* equip([{code: 'wooden_staff', slot: 'weapon', quantity: 1}])
});
