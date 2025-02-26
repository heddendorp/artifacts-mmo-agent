import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { planner } from "./plan.ts";
import { replanner } from "./replan.ts";
import { tools } from "./tools.ts";

const PlanExecuteState = Annotation.Root({
	input: Annotation<string>({
		reducer: (x, y) => y ?? x ?? "",
	}),
	plan: Annotation<string[]>({
		reducer: (x, y) => y ?? x ?? [],
	}),
	pastSteps: Annotation<[string, string][]>({
		reducer: (x, y) => x.concat(y),
	}),
	response: Annotation<string>({
		reducer: (x, y) => y ?? x,
	}),
});

const agentExecutor = new ChatVertexAI({
	authOptions: { projectId: "artifact-452109" },
	model: "gemini-2.0-flash",
	temperature: 0,
}).bindTools(tools);

async function executeStep(
	state: typeof PlanExecuteState.State,
	config?: RunnableConfig,
): Promise<Partial<typeof PlanExecuteState.State>> {
	const task = state.plan[0];

	const messages = await agentExecutor.invoke([new HumanMessage(task)], config);
	console.log(messages);

	return {
		pastSteps: [[task, messages.content.toString()]],
		plan: state.plan.slice(1),
	};
}

async function planStep(
	state: typeof PlanExecuteState.State,
): Promise<Partial<typeof PlanExecuteState.State>> {
	const plan = await planner.invoke({ objective: state.input });
	return { plan: plan.steps };
}

async function replanStep(
	state: typeof PlanExecuteState.State,
): Promise<Partial<typeof PlanExecuteState.State>> {
	const output = await replanner.invoke({
		input: state.input,
		plan: state.plan.join("\n"),
		pastSteps: state.pastSteps
			.map(([step, result]) => `${step}: ${result}`)
			.join("\n"),
	});
	const toolCall = output;

	if (toolCall.type == "response") {
		return { response: toolCall.args?.response };
	}

	return { plan: toolCall.args?.steps };
}

function shouldEnd(state: typeof PlanExecuteState.State) {
	return state.response ? "true" : "false";
}

const workflow = new StateGraph(PlanExecuteState)
	.addNode("planner", planStep)
	.addNode("agent", executeStep)
	.addNode("replan", replanStep)
	.addEdge(START, "planner")
	.addEdge("planner", "agent")
	.addEdge("agent", "replan")
	.addConditionalEdges("replan", shouldEnd, {
		true: END,
		false: "agent",
	});

// Finally, we compile it!
// This compiles it into a LangChain Runnable,
// meaning you can use it as you would any other runnable
const app = workflow.compile();

const config = { recursionLimit: 50 };
const inputs = {
	input: "Fight a chicken with the character LukasAI",
};

for await (const event of await app.stream(inputs, config)) {
	console.log(event);
}
