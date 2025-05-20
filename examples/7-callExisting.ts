/**
 * Azure AI Agents Demo: Call Existing Agent Example
 * 
 * This example demonstrates how to use an existing AI Agent by its ID
 * rather than creating a new one. This is useful for reusing agents
 * that have been previously created and configured.
 */

//#region Imports
import { AIProjectsClient, MessageTextContentOutput } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";
//#endregion

//#region Configuration
// Load connection string from environment variables or use default placeholder
const connectionString =
  process.env["AI_FOUNDRY_PROJECT_CONNECTION_STRING"] ||
  "<project connection string>";

// Initialize AI Projects client with connection string and Azure credentials
const client = AIProjectsClient.fromConnectionString(
  connectionString || "",
  new DefaultAzureCredential()
);

//#region Agent Retrieval
// Get existing agent ID from environment variables
const agentId = process.env["AI_AGENT_ID"];
if (!agentId) {
  throw new Error("AI_AGENT_ID environment variable is not set.");
}
console.log(`Using existing agent, agent ID: ${agentId}`);

// Create a new conversation thread
const thread = await client.agents.createThread();
console.log(`Created thread, thread ID: ${thread.id}`);
//#endregion

//#region Message and Run
// Create a user message in the thread with a specific query
const userMessage = {
  role: "user",
  content: "what are the available models to use?",
};
// show role and content of the message
console.log(`Message role: ${userMessage.role}, content: ${userMessage.content}`);
// Create a message in the thread
const message = await client.agents.createMessage(thread.id, userMessage);

console.log(`Created message, message ID: ${message.id}`);
// Start a run with the existing agent
let run = await client.agents.createRun(thread.id, agentId);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the run completes (could be queued, in_progress, or requires_action)
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Result Processing
// Retrieve messages from the thread to get the agent's response
const messages = await client.agents.listMessages(thread.id);
console.log(
  `Message ${message.id} contents: ${
    (messages.data[0].content[0] as MessageTextContentOutput).text.value
  }`
);
//#endregion

//#region Cleanup
// Delete the thread to clean up resources
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID: ${thread.id}`);
//#endregion
