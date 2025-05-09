/**
 * Azure AI Agents Demo: Threads Example
 * 
 * This example demonstrates how to create, retrieve, and delete threads,
 * which are used to organize conversations with Azure AI Agents.
 */

//#region Imports
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

//#region Thread Lifecycle
// Create a new conversation thread
const thread = await client.agents.createThread();
console.log(`Created thread, thread ID : ${thread.id}`);

// Retrieve information about the thread by its ID
const _thread = await client.agents.getThread(thread.id);
console.log(`Retrieved thread, thread ID : ${_thread.id}`);

// Delete the thread when it's no longer needed
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID : ${_thread.id}`);
//#endregion
