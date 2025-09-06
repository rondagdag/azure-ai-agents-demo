/**
 * Azure AI Agents Demo: Run Management Example
 * 
 * This example demonstrates how to create and manage runs with an AI Agent,
 * including creating threads, sending messages, managing run lifecycle,
 * and examining run steps.
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
// Create a simple AI agent
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are a helpful agent",
});
console.log(`Created agent, agent ID: ${agent.id}`);

// Create a conversation thread
const thread = await client.agents.threads.create();
console.log(`Created thread, thread ID: ${thread.id}`);

// show role and content of the message
const userRole = "user";
const userContent = "hello, world!";
console.log(`Message role: ${userRole}, content: ${userContent}`);
//#endregion

//#region Message and Run Creation
// Add a simple greeting message to the thread
const message = await client.agents.messages.create(thread.id, userRole, userContent);
console.log(`Created message, message ID: ${message.id}`);

// Start a run with the agent
let run = await client.agents.runs.create(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the run completes
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.runs.get(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Run Analysis
// List all steps that were part of the run
const runSteps = await client.agents.runSteps.list(thread.id, run.id);
console.log(`Listed run steps, run ID: ${run.id}`);

// Retrieve and examine each individual run step
// Convert AsyncIterator to array for better handling
const runStepsArray = [];
for await (const step of runSteps) {
  runStepsArray.push(step);
}

for (const runStep of runStepsArray) {
  const step = await client.agents.runSteps.get(thread.id, run.id, runStep.id);
  console.log(`Retrieved run step, step ID: ${step.id}`);
  console.log(`  Type: ${step.type}`);
  console.log(`  Status: ${step.status}`);
  console.log(`  Created at: ${new Date(step.createdAt).toLocaleString()}`);
  
  // Log step details based on type - output varies by type
  if (step.stepDetails) {
    console.log(`  Step details: ${JSON.stringify(step.stepDetails, null, 2)}`);
  }
  
  // Log any failures
  if (step.status === 'failed') {
    console.log(`  Step failed`);
  }
  
  console.log('-----------------------------------');
}
//#endregion

//#region Cleanup
// Delete all created resources
await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID: ${thread.id}`);

await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion
