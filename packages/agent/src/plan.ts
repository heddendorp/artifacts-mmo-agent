import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { tools } from "./tools.ts";

const plan = zodToJsonSchema(
	z.object({
		steps: z
			.array(z.string())
			.describe("different steps to follow, should be in sorted order"),
	}),
);
const planFunction = {
	name: "plan",
	description: "This tool is used to plan the steps to follow",
	parameters: plan,
};

export const planTool = {
	type: "function",
	function: planFunction,
};

const plannerPrompt = ChatPromptTemplate.fromTemplate(
	`For the given objective, come up with a simple step by step plan. \
Make sure to familiarize yourself with the starting situation. \
This plan should involve individual tool uses, that if executed correctly will result in the stated objective. Do not add any superfluous steps. \
If there is input needed for some steps, make sure to gather it with previous steps. \
After the final step, the objective should have been achieved. Make sure that each step has all the information needed - do not skip steps. \
 
The following tools are available to you to retrieve data and run actions: 
${tools
	.map(
		(tool) =>
			`${tool.name}: ${tool.description} - input (${Object.entries(
				tool.schema.shape,
			)
				.map(([key, value]) => `${key}: ${value.description}`)
				.join(", ")})`,
	)
	.join("\n")}

Objective:
{objective}`,
);

const model = new ChatVertexAI({
	authOptions: { projectId: "artifact-452109" },
	model: "gemini-2.0-flash",
	temperature: 0,
}).withStructuredOutput(
	z.object({
		steps: z
			.array(z.string())
			.describe("different steps to follow, should be in sorted order"),
	}),
);

export const planner = plannerPrompt.pipe(model);
