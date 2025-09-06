/**
 * Azure AI Agents Demo: Basic Example
 * 
 * This example demonstrates the simplest use case of creating and deleting an Azure AI Agent
 * with minimal configuration.
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
