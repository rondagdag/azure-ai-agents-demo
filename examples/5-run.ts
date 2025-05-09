/**
 * Azure AI Agents Demo: Run Management Example
 * 
 * This example demonstrates how to create and manage runs with an AI Agent,
 * including creating threads, sending messages, managing run lifecycle,
 * and examining run steps.
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

//#region Agent and Thread Setup
// Create a simple AI agent
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are a helpful agent",
});
console.log(`Created agent, agent ID: ${agent.id}`);

// Create a conversation thread
const thread = await client.agents.createThread();
console.log(`Created thread, thread ID: ${thread.id}`);
//#endregion

//#region Message and Run Creation
// Add a simple greeting message to the thread
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "hello, world!",
});
console.log(`Created message, message ID: ${message.id}`);

// Start a run with the agent
let run = await client.agents.createRun(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the run completes
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Run Analysis
// List all steps that were part of the run
const runSteps = await client.agents.listRunSteps(thread.id, run.id);
console.log(`Listed run steps, run ID: ${run.id}`);

// Retrieve and examine each individual run step
runSteps.data.forEach(async (runStep) => {
  const step = await client.agents.getRunStep(thread.id, run.id, runStep.id);
  console.log(`Retrieved run step, step ID: ${step}`);
});
//#endregion

//#region Cleanup
// Delete all created resources
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID: ${thread.id}`);

await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion
