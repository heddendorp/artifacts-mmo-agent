import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatVertexAI } from "@langchain/google-vertexai";
import {
	Annotation,
	END,
	MemorySaver,
	MessagesAnnotation,
	START,
	StateGraph,
} from "@langchain/langgraph";
import { ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOllama } from "@langchain/ollama";
import { tools } from "./tools.ts";

const rules = ` 
The name of the character the AI plays is \`LukasAI\`.
Your job is to use tools to play the character and progress. 
If you encounter an error, try to find a way to mitigate the error. 
Try to act without asking for user input. 
If the character has low hp, consider resting or consuming an item. If you don't have items, consider checking consumable items you can craft that can heal you.
Before crafting an item, try to find out what you need as ingredients.
If possible try to collect all input items for crafting first and then craft multiple in one go, while collecting items, check regularly if you can move on.
If an action returns a cooldown, make sure to wait for it before starting the next action.
Before fighting a monster, make sure that our character has more hp than then monster you are about to fight. 
Before fighting a monster, equip the best weapon against that monster.
If you want to fulfill a task and your character does not have one set at the moment, get it from the task master.
Explain what you are planning and give progress updates along the way.

Game rules:
Monsters do not despawn after a fight.
A task is fulfilled when the characters task progress equals the task total.
Only items that can be found in the item overview can be crafted.`;

const StateAnnotation = Annotation.Root({
	...MessagesAnnotation.spec,
	// user provided
	characterName: Annotation<string>,
	// updated by the tool
	mapTiles: Annotation<any[]>,
	monsters: Annotation<any[]>,
	items: Annotation<any[]>,
	characterData: Annotation<any>,
	task: Annotation<any>,
});

const stateModifier = (state: typeof StateAnnotation.State) => {
	const mapTiles = state.mapTiles;
	const characterData = state.characterData;
	const monsters = state.monsters;
	const items = state.items;
	const task = state.task;
	const characterName = state.characterName;
	const systemMessage = new SystemMessage(`
	${rules}
	There is already some information.

	These are the loaded map tiles:
	${JSON.stringify(mapTiles)}
	
	These are the loaded monsters:
	${JSON.stringify(monsters)}
	
	This task is currently loaded:
	${JSON.stringify(task)}
	
	These are the loaded items:
	${JSON.stringify(items)}
	
	This is the character information: 
	${JSON.stringify(characterData)}`);
	// console.log(systemMessage);
	return [
		systemMessage,
		...state.messages.filter((message) => message.getType() !== "system"),
	];
};

// const modelWithTools = new ChatVertexAI({
// 	authOptions: { projectId: "artifact-452109" },
// 	model: "gemini-2.0-flash",
// 	temperature: 0,
// }).bindTools(tools);

const toolNodeForGraph = new ToolNode(tools);
const checkpointer = new MemorySaver();

// const shouldContinue = (state: typeof MessagesAnnotation.State) => {
// 	const { messages } = state;
// 	const lastMessage = messages[messages.length - 1];
// 	if (
// 		"tool_calls" in lastMessage &&
// 		Array.isArray(lastMessage.tool_calls) &&
// 		lastMessage.tool_calls?.length
// 	) {
// 		return "tools";
// 	}
// 	return END;
// };

// const callModel = async (state: typeof MessagesAnnotation.State) => {
// 	const { messages } = state;
// 	const response = await modelWithTools.invoke(messages);
// 	return { messages: response };
// };

// const workflow = new StateGraph(MessagesAnnotation)
// 	// Define the two nodes we will cycle between
// 	.addNode("agent", callModel)
// 	.addNode("tools", toolNodeForGraph)
// 	.addEdge(START, "agent")
// 	.addConditionalEdges("agent", shouldContinue, ["tools", END])
// 	.addEdge("tools", "agent");

// const app = workflow.compile(/*{ checkpointer }*/);

const agent = createReactAgent({
	llm: new ChatVertexAI({
		authOptions: { projectId: "artifact-452109" },
		model: "gemini-2.0-flash",
		temperature: 0,
	}),
	// llm: new ChatOllama({
	// 	model: "llama3.2",
	// 	temperature: 0,
	// }),
	tools,
	checkpointSaver: checkpointer,
	stateSchema: StateAnnotation,
	prompt: stateModifier,
});

const inputs = {
	messages: [
		new SystemMessage(rules),
		new HumanMessage("Finish the current task, then end"),
	],
};

const config = {
	configurable: { thread_id: "1" },
	recursionLimit: 200,
};

const stream = await agent.stream(inputs, {
	...config,
	streamMode: "values",
});

for await (const { messages } of stream) {
	const msg = messages[messages?.length - 1];

	if (msg?.content && msg.content.length < 200) {
		console.log(msg.content);
	} else if (msg?.tool_calls?.length > 0) {
		console.log(msg.tool_calls);
	} else {
		// console.log(msg);
	}
	console.log("-----\n");
}
