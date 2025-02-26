import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const token = process.env.ARTIFACT_TOKEN;
export const artifactClient = createClient<paths>({
	baseUrl: "https://api.artifactsmmo.com",
});

const authMiddleware: Middleware = {
	onRequest({ request }) {
		request.headers.set("Authorization", "Bearer " + token);
	},
};

artifactClient.use(authMiddleware);
