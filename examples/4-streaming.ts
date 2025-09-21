/**
 * Azure AI Agents Demo: Simulated Streaming Response Example
 * 
 * This example demonstrates how to simulate real-time responses from an AI Agent
 * by polling the run status and displaying results with a streaming effect.
 * Note: The Azure AI Projects SDK doesn't currently support true streaming events,
 * so this example shows a polling-based approach that simulates streaming behavior.
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
const messageContent = {
  role: "user",
  content: "Hello, tell me a joke",
};
// show role and content of the message
console.log(`Message role: ${messageContent.role}, content: ${messageContent.content}`);
//#endregion

//#region Message Creation and Run Setup
// Add a user message requesting a joke
const message = await client.agents.messages.create(thread.id, "user", messageContent.content);

console.log(`Created message, message ID: ${message.id}`);
// show role and content of the message
// Access the message content correctly
console.log(
  `Message role: ${message.role}, content: ${
    message.content[0]?.type === "text" ? (message.content[0] as any).text?.value : "No text content"
  }`
);

// Create and start a run with the agent
let run = await client.agents.runs.create(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);
console.log(`Initial run status: ${run.status}`);
//#endregion

//#region Simulated Streaming via Polling
// Since real streaming events aren't available in the current SDK, 
// we'll simulate streaming by polling the run status and displaying incremental updates
console.log("\n🔄 Starting simulated streaming (polling for updates)...");

// Poll until the run completes and show status updates
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
  run = await client.agents.runs.get(thread.id, run.id);
  console.log(`📡 Status update: ${run.status}`);
}

// Check final status
if (run.status === "completed") {
  console.log("✅ Run completed successfully!");
  
  // Retrieve messages to show the "streaming" result
  console.log("\n📝 Retrieving agent response...");
  const messages = await client.agents.messages.list(thread.id);
  
  // Find the assistant's response
  const assistantMessages = [];
  for await (const msg of messages) {
    if (msg.role === "assistant") {
      assistantMessages.push(msg);
    }
  }
  
  // Display the response with simulated streaming effect
  const latestResponse = assistantMessages[assistantMessages.length - 1];
  if (latestResponse && latestResponse.content) {
    for (const content of latestResponse.content) {
      if (content.type === "text") {
        const textContent = content as any;
        const fullText = textContent.text?.value || "";
        
        // Simulate streaming by showing text character by character
        console.log("\n🎭 Simulated streaming response:");
        for (let i = 0; i < fullText.length; i += 5) {
          const chunk = fullText.slice(i, i + 5);
          process.stdout.write(chunk);
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for effect
        }
        console.log("\n\n✨ Streaming simulation complete!");
      }
    }
  }
} else if (run.status === "failed") {
  console.log(`❌ Run failed: ${run.lastError?.message || "Unknown error"}`);
} else {
  console.log(`⚠️ Run ended with status: ${run.status}`);
}
//#endregion

//#region Cleanup
// Delete the agent to clean up resources
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID : ${agent.id}`);

// Note: In a real application, you might also want to delete the thread:
// await client.agents.threads.delete(thread.id);
// console.log(`Deleted thread, thread ID : ${thread.id}`);
//#endregion
