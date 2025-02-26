export const transformError = (error: { code: number; message: string }) => {
	switch (error.code) {
		case 598: {
			throw new Error(
				"There is no monster to fight, consider moving to a different location on the map that has a monster",
			);
		}
		default:
			throw new Error(error.message);
	}
};
