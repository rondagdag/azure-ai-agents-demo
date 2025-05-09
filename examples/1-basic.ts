/**
 * Azure AI Agents Demo: Basic Example
 * 
 * This example demonstrates the simplest use case of creating and deleting an Azure AI Agent
 * with minimal configuration.
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

//#region Agent Lifecycle
// Create a simple AI agent with minimal configuration
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-ai-agent-hackathon",
  instructions: "You are helpful agent",
});
console.log(`Created agent, agent ID : ${agent.id}`);

// Clean up by deleting the agent when finished
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion
