/**
 * Azure AI Agents Demo: Messages Example
 * 
 * This example demonstrates how to create, list, and process messages in a thread
 * without explicitly creating a run. This is useful for simple message management
 * or when you want to manually handle agent interactions.
 */

//#region Imports
import type { MessageTextContentOutput } from "@azure/ai-projects";
import { AIProjectsClient } from "@azure/ai-projects";
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
//#endregion

//#region Setup
// Create a simple AI agent for the conversation
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are helpful agent",
});

// Create a conversation thread to hold the messages
const thread = await client.agents.createThread();
//#endregion

//#region Message Operations
// Create a user message in the thread
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "hello, world!",
});
console.log(`Created message, message ID: ${message.id}`);

// List messages in the thread and access the content
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
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Delete the agent to clean up resources
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID : ${agent.id}`);
//#endregion
