import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { artifactClient } from "artifact-api";
import { z } from "zod";
import { transformError } from "./transform-errors.ts";

const getMaps = tool(
	async ({ contentType }, config) => {
		const { data, error } = await artifactClient.GET("/maps", {
			params: { query: { content_type: contentType } },
		});
		if (data) {
			return new Command({
				update: {
					mapTiles: data.data,
					messages: [
						new ToolMessage({
							content: "Successfully looked up the map tiles",
							tool_call_id: config.toolCall.id,
						}),
					],
				},
			});
		}
		transformError(error.error);
	},
	{
		name: "get_maps",
		description:
			"Get an overview of all map tiles to learn what is found where and where the character could move",
		schema: z.object({
			contentType: z
				.enum([
					"monster",
					"resource",
					"workshop",
					"bank",
					"grand_exchange",
					"tasks_master",
					"npc",
				])
				.optional()
				.describe("Limit returned map tiles to a specific content type"),
		}),
	},
);

const getItems = tool(
	async ({ type, craftSkill }, config) => {
		const { data, error } = await artifactClient.GET("/items", {
			params: { query: { type, craft_skill: craftSkill } },
		});
		if (data) {
			return new Command({
				update: {
					items: data.data,
					messages: [
						new ToolMessage({
							content: "Successfully looked items",
							tool_call_id: config.toolCall.id,
						}),
					],
				},
			});
		}
		transformError(error.error);
	},
	{
		name: "get_items",
		description:
			"Get an overview of items that can be crafted, found or dropped",
		schema: z.object({
			maxLevel: z
				.number()
				.gte(1)
				.optional()
				.describe("Maximum level of the returned items"),
			name: z.string().optional().describe("Name to filter items by"),
			type: z
				.enum([
					"utility",
					"body_armor",
					"weapon",
					"resource",
					"leg_armor",
					"helmet",
					"boots",
					"shield",
					"amulet",
					"ring",
					"artifact",
					"currency",
					"consumable",
					"rune",
					"bag",
				])
				.optional()
				.describe("Limit returned items by type"),
			craftSkill: z
				.enum([
					"weaponcrafting",
					"gearcrafting",
					"jewelrycrafting",
					"cooking",
					"woodcutting",
					"mining",
					"alchemy",
				])
				.optional()
				.describe("Limit returned items by crafting skill"),
		}),
	},
);

const wait = tool(
	async ({ duration }) => {
		return new Promise((resolve) => {
			setTimeout(() => resolve("Waiting finished"), duration * 1000);
		});
	},
	{
		name: "wait",
		description:
			"Wait for a specified time, can be used to handle cooldown periods",
		schema: z.object({
			duration: z.number().describe("Waiting duration in seconds"),
		}),
	},
);

const getCharacter = tool(
	async ({ name }, config) => {
		const { data, error } = await artifactClient.GET("/characters/{name}", {
			params: { path: { name } },
		});
		if (data) {
			return new Command({
				update: {
					characterData: { [name]: data.data },
					messages: [
						new ToolMessage({
							content: "Successfully retrieved character details",
							tool_call_id: config.toolCall.id,
						}),
					],
				},
			});
		}
		transformError(error.error);
	},
	{
		name: "get_character",
		description:
			"Read the information such as inventory and location about a character by name",
		schema: z.object({
			name: z.string().describe("The name of the character to get"),
		}),
	},
);

const getTask = tool(
	async ({ code }, config) => {
		const { data, error } = await artifactClient.GET("/tasks/list/{code}", {
			params: { path: { code } },
		});
		if (data) {
			return new Command({
				update: {
					task: data.data,
					messages: [
						new ToolMessage({
							content: "Successfully retrieved task details",
							tool_call_id: config.toolCall.id,
						}),
					],
				},
			});
		}
		transformError(error.error);
	},
	{
		name: "get_task",
		description: "Retrieve the details of one task",
		schema: z.object({
			code: z.string().describe("The name of the character to get"),
		}),
	},
);

const getMonsters = tool(
	async (_, config) => {
		const { data, error } = await artifactClient.GET("/monsters");
		if (data) {
			return new Command({
				update: {
					monsters: data.data,
					messages: [
						new ToolMessage({
							content: "Successfully retrieved monster details",
							tool_call_id: config.toolCall.id,
						}),
					],
				},
			});
		}
		transformError(error.error);
	},
	{
		name: "get_monsters",
		description: "Get details for all monsters",
		schema: z.object({
			noop: z.string().optional().describe("No op input"),
		}),
	},
);

const fight = tool(
	async ({ name }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/fight",
			{
				params: { path: { name } },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "fight",
		description: "Start a fight against a monster on the character's map",
		schema: z.object({
			name: z.string().describe("The name of the character that should fight"),
		}),
	},
);

const gather = tool(
	async ({ name }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/gathering",
			{
				params: { path: { name } },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "gather",
		description: "Harvest a resource on the character's map",
		schema: z.object({
			name: z.string().describe("The name of the character that should fight"),
		}),
	},
);

const acceptTask = tool(
	async ({ name }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/task/new",
			{
				params: { path: { name } },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "accept_task",
		description:
			"Accept a task, possible if the character is on the map with the task master",
		schema: z.object({
			name: z
				.string()
				.describe("The name of the character that should accept the task"),
		}),
	},
);

const completeTask = tool(
	async ({ name }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/task/complete",
			{
				params: { path: { name } },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "complete_task",
		description:
			"Once your task progress equals your task total, you can complete it at the task master.",
		schema: z.object({
			name: z
				.string()
				.describe("The name of the character that should complete the task"),
		}),
	},
);

const crafting = tool(
	async ({ name, code, quantity }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/crafting",
			{
				params: { path: { name } },
				body: { code, quantity },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "crafting",
		description:
			"Craft an item. The character must be on a map with the correct workshop and have the required ingredients.",
		schema: z.object({
			name: z.string().describe("The name of the character that should fight"),
			code: z.string().describe("Code of the item to craft"),
			quantity: z.number().gte(1).describe("Item quantity"),
		}),
	},
);

const useItem = tool(
	async ({ name, code, quantity }) => {
		const { data, error } = await artifactClient.POST("/my/{name}/action/use", {
			params: { path: { name } },
			body: { code, quantity },
		});
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "use_item",
		description: "Use a consumable item",
		schema: z.object({
			name: z.string().describe("The name of the character that should fight"),
			quantity: z.number().gte(1).describe("Item quantity"),
			code: z.string().describe("Code of the item to use"),
		}),
	},
);

const unequipItem = tool(
	async ({ name, slot, quantity }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/unequip",
			{
				params: { path: { name } },
				body: { slot, quantity },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "unequip_item",
		description: "Unequip an item on your character",
		schema: z.object({
			name: z
				.string()
				.describe("The name of the character that should unequip the item"),
			quantity: z
				.number()
				.gte(1)
				.describe("Item quantity. Applicable to utilities only"),
			slot: z
				.enum([
					"weapon",
					"shield",
					"helmet",
					"body_armor",
					"leg_armor",
					"boots",
					"ring1",
					"ring2",
					"amulet",
					"artifact1",
					"artifact2",
					"artifact3",
					"utility1",
					"utility2",
					"bag",
					"rune",
				])
				.describe("Slot of the item to unequip"),
		}),
	},
);

const equipItem = tool(
	async ({ name, slot, quantity, code }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/equip",
			{
				params: { path: { name } },
				body: { slot, quantity, code },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "equip_item",
		description: "Equip an item on your character",
		schema: z.object({
			code: z.string().describe("Code of the item to equip"),
			name: z
				.string()
				.describe("The name of the character that should equip the item"),
			quantity: z
				.number()
				.gte(1)
				.describe("Item quantity. Applicable to utilities only"),
			slot: z
				.enum([
					"weapon",
					"shield",
					"helmet",
					"body_armor",
					"leg_armor",
					"boots",
					"ring1",
					"ring2",
					"amulet",
					"artifact1",
					"artifact2",
					"artifact3",
					"utility1",
					"utility2",
					"bag",
					"rune",
				])
				.describe("Slot of the item to unequip"),
		}),
	},
);

const rest = tool(
	async ({ name }) => {
		const { data, error } = await artifactClient.POST(
			"/my/{name}/action/rest",
			{
				params: { path: { name } },
			},
		);
		if (data) {
			return data.data;
		} else {
			return transformError(error.error);
		}
	},
	{
		name: "rest",
		description:
			"Recovers hit points by resting. (1 second per 5 HP, minimum 3 seconds)",
		schema: z.object({
			name: z.string().describe("The name of the character to rest"),
		}),
	},
);

const move = tool(
	async ({ name, x, y }) =>
		artifactClient.POST("/my/{name}/action/move", {
			params: { path: { name } },
			body: { x, y },
		}),
	{
		name: "move",
		description:
			"Moves a character on the map using the map's X and Y position",
		schema: z.object({
			name: z.string().describe("The name of the character to move"),
			x: z.number().describe("The x coordinate of the destination"),
			y: z.number().describe("The y coordinate of the destination"),
		}),
	},
);

export const tools = [
	getMaps,
	getCharacter,
	fight,
	move,
	wait,
	rest,
	useItem,
	getTask,
	getItems,
	unequipItem,
	equipItem,
	crafting,
	gather,
	acceptTask,
	completeTask,
	getMonsters,
];
