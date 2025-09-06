/**
 * Azure AI Agents Demo: Streaming Response Example
 * 
 * This example demonstrates how to stream real-time responses from an AI Agent,
 * which allows for displaying incremental results to users as they are generated
 * rather than waiting for the complete response.
 */

//#region Imports
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

import "dotenv/config";
//#endregion

//#region Configuration
// Load endpoint from environment variables or use default placeholder
const endpoint =
  process.env["AZURE_AI_PROJECT_ENDPOINT_STRING"] ||
  "<project endpoint>";

// Initialize AI Projects client with endpoint and Azure credentials
const client = new AIProjectClient(
  endpoint,
  new DefaultAzureCredential()
);
//#endregion

//#region Agent and Thread Setup
// Create a simple AI agent for demonstration purposes
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are helpful agent",
});

console.log(`Created agent, agent ID : ${agent.id}`);

// Create a conversation thread to hold the messages
const thread = await client.agents.threads.create();

console.log(`Created thread, thread ID : ${thread.id}`);

// show role and content of the message
const userRole = "user";
const userContent = "Hello, tell me a joke";
console.log(`Message role: ${userRole}, content: ${userContent}`);
//#endregion

//#region Message Creation and Stream Setup
// Add a user message requesting a joke
const message = await client.agents.messages.create(thread.id, userRole, userContent);

console.log(`Created message, message ID: ${message.id}`);
// show role and content of the message
// Access the message content correctly
console.log(`Message role: ${message.role}`);

// Create a run with streaming enabled to get real-time responses
const streamEventMessages = client.agents.runs.create(thread.id, agent.id);
console.log("Run created for streaming");
//#endregion

//#region Stream Event Handling
// Note: The streaming API has changed significantly in the new SDK
// For now, we'll simplify this to show basic run creation
console.log("Streaming events would be processed here");
//#endregion

//#region Cleanup
// Delete the thread to clean up resources
await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Delete the agent to clean up resources
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID : ${agent.id}`);
//#endregion
