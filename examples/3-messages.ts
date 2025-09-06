/**
 * Azure AI Agents Demo: Messages Example
 * 
 * This example demonstrates how to create, list, and process messages in a thread
 * without explicitly creating a run. This is useful for simple message management
 * or when you want to manually handle agent interactions.
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

//#region Setup
// Create a simple AI agent for the conversation
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are helpful agent",
});

// Create a conversation thread to hold the messages
const thread = await client.agents.threads.create();

// show role and content of the message
const userRole = "user";
const userContent = "hello, world!";
console.log(`Message role: ${userRole}, content: ${userContent}`);
//#endregion

//#region Message Operations
// Create a user message in the thread
const message = await client.agents.messages.create(thread.id, userRole, userContent);
console.log(`Created message, message ID: ${message.id}`);


//#region Cleanup
// Delete the thread to clean up resources
await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Delete the agent to clean up resources
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID : ${agent.id}`);
//#endregion
