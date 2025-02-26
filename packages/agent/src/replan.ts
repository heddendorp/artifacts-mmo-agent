import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { planTool } from "./plan.ts";
import { tools } from "./tools.ts";

const response = zodToJsonSchema(
	z.object({
		response: z.string().describe("Response to user."),
	}),
);

const responseTool = {
	type: "function",
	function: {
		name: "response",
		description: "Response to user.",
		parameters: response,
	},
};

const replannerPrompt = ChatPromptTemplate.fromTemplate(
	`For the given objective, come up with a simple step by step plan. \
Make sure to familiarize yourself with the starting situation. \
This plan should involve individual tool uses, that if executed correctly will result in the stated objective. Do not add any superfluous steps. \
If there is input needed for some steps, make sure to gather it with previous steps. \
After the final step, the objective should have been achieved. Make sure that each step has all the information needed - do not skip steps. \

Your objective was this:
{input}

Your original plan was this:
{plan}

You have currently done the follow steps:
{pastSteps}

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

Update your plan accordingly. If no more steps are needed and you can return to the user, then respond with that and use the 'response' function.
Otherwise, fill out the plan.  
Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`,
);

const parser = new JsonOutputToolsParser();
export const replanner = replannerPrompt
	.pipe(
		new ChatVertexAI({
			authOptions: { projectId: "artifact-452109" },
			model: "gemini-2.0-flash",
			temperature: 0,
		}).bindTools([planTool, responseTool]),
	)
	.pipe(parser);
