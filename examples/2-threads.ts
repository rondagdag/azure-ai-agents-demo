/**
 * Azure AI Agents Demo: Threads Example
 * 
 * This example demonstrates how to create, retrieve, and delete threads,
 * which are used to organize conversations with Azure AI Agents.
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

//#region Thread Lifecycle
// Create a new conversation thread
const thread = await client.agents.threads.create();
console.log(`Created thread, thread ID : ${thread.id}`);

// Retrieve information about the thread by its ID
const _thread = await client.agents.threads.get(thread.id);
console.log(`Retrieved thread, thread ID : ${_thread.id}`);

// Delete the thread when it's no longer needed
await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID : ${_thread.id}`);
//#endregion
