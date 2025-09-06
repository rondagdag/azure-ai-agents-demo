/**
 * Azure AI Agents Demo: Call Existing Agent Example
 * 
 * This example demonstrates how to use an existing AI Agent by its ID
 * rather than creating a new one. This is useful for reusing agents
 * that have been previously created and configured.
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

//#region Main Function
async function runDemo(agentToUse: string) {
  // Create a new conversation thread
  const thread = await client.agents.threads.create();
  console.log(`\nCreated thread, thread ID: ${thread.id}`);

  // Create a user message in the thread with a specific query
  const userMessage = {
    role: "user",
    content: "what are the available models to use?",
  };
  // show role and content of the message
  console.log(`Message role: ${userMessage.role}, content: ${userMessage.content}`);
  // Create a message in the thread
  const message = await client.agents.messages.create(thread.id, "user", userMessage.content);

  console.log(`Created message, message ID: ${message.id}`);
  // Start a run with the existing agent
  let run = await client.agents.runs.create(thread.id, agentToUse);
  console.log(`Created run, run ID: ${run.id}`);

  // Poll until the run completes (could be queued, in_progress, or requires_action)
  while (["queued", "in_progress", "requires_action"].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await client.agents.runs.get(thread.id, run.id);
    console.log(`Run status: ${run.status}`);
  }

  //#region Result Processing
  // Retrieve messages from the thread to get the agent's response
  console.log("\n--- Retrieving Messages ---");
  const messages = await client.agents.messages.list(thread.id);
  const messagesArray = [];
  for await (const message of messages) {
    messagesArray.push(message);
  }

  console.log(`Total messages retrieved: ${messagesArray.length}`);

  // Display all messages in the conversation
  console.log("\n--- Conversation Messages ---");
  for (let i = messagesArray.length - 1; i >= 0; i--) {
    const msg = messagesArray[i];
    console.log(`\n[${msg.role.toUpperCase()}] (${new Date(msg.createdAt).toLocaleTimeString()}):`);
    
    // Display message content
    for (const content of msg.content) {
      if (content.type === "text") {
        // Type assertion for text content
        const textContent = content as any;
        console.log(textContent.text?.value || "[Text content not available]");
      } else if (content.type === "image_file") {
        // Type assertion for image content
        const imageContent = content as any;
        console.log(`[Image file: ${imageContent.imageFile?.fileId || "unknown"}]`);
      } else {
        console.log(`[Content type: ${content.type}]`);
      }
    }
  }
  //#endregion

  //#region Cleanup
  // Delete the thread to clean up resources
  await client.agents.threads.delete(thread.id);
  console.log(`\nDeleted thread, thread ID: ${thread.id}`);
  //#endregion
}
//#endregion

//#region Agent Setup
// Get existing agent ID from environment variables
const agentId = process.env["AI_AGENT_ID"];

if (!agentId) {
  console.log("AI_AGENT_ID environment variable is not set.");
  console.log("Creating a new agent for demonstration purposes...");
  
  // Create a temporary agent for demonstration
  const demoAgent = await client.agents.createAgent("gpt-4o-mini", {
    name: "Demo Helper Agent",
    instructions: "You are a helpful assistant that can answer questions about available models and provide assistance.",
  });

  console.log(`Created agent, agent ID: ${demoAgent.id}`);
  console.log(`Agent name: ${demoAgent.name}`);
  console.log(`Agent model: ${demoAgent.model}`);
  console.log(`Agent instructions: ${demoAgent.instructions}`);

  // Use the temporary agent for the demo
  await runDemo(demoAgent.id);
  
  // Clean up the temporary agent
  await client.agents.deleteAgent(demoAgent.id);
  console.log(`\nDeleted temporary agent, agent ID: ${demoAgent.id}`);

} else {
  console.log(`Using existing agent from environment, agent ID: ${agentId}`);
  
  try {
    // Retrieve agent details to display the agent name
    const agent = await client.agents.getAgent(agentId);
    console.log(`Agent name: ${agent.name}`);
    console.log(`Agent model: ${agent.model}`);
    console.log(`Agent instructions: ${agent.instructions}`);
    
    // Use the existing agent for the demo
    await runDemo(agentId);
    
  } catch (error: any) {
    console.error(`Error retrieving agent: ${error.message}`);
    console.log("The agent ID might be invalid or the agent might have been deleted.");
    
    // Fallback: create a temporary agent
    console.log("\nFalling back to creating a temporary agent...");
    const fallbackAgent = await client.agents.createAgent("gpt-4o-mini", {
      name: "Fallback Demo Agent",
      instructions: "You are a helpful assistant that can answer questions about available models and provide assistance.",
    });
    
    console.log(`Created fallback agent, agent ID: ${fallbackAgent.id}`);
    await runDemo(fallbackAgent.id);
    await client.agents.deleteAgent(fallbackAgent.id);
    console.log(`\nDeleted fallback agent, agent ID: ${fallbackAgent.id}`);
  }
}
//#endregion