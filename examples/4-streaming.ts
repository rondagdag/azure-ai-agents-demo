/**
 * Azure AI Agents Demo: Streaming Response Example
 * 
 * This example demonstrates how to stream real-time responses from an AI Agent,
 * which allows for displaying incremental results to users as they are generated
 * rather than waiting for the complete response.
 */

//#region Imports
import type {
  MessageDeltaChunk,
  MessageDeltaTextContent,
  ThreadRunOutput,
} from "@azure/ai-projects";
import {
  AIProjectsClient,
  DoneEvent,
  ErrorEvent,
  MessageStreamEvent,
  RunStreamEvent,
} from "@azure/ai-projects";
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
// Create a simple AI agent for demonstration purposes
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "my-agent",
  instructions: "You are helpful agent",
});

console.log(`Created agent, agent ID : ${agent.id}`);

// Create a conversation thread to hold the messages
const thread = await client.agents.createThread();

console.log(`Created thread, thread ID : ${thread.id}`);
const messageContent = {
  role: "user",
  content: "Hello, tell me a joke",
};
// show role and content of the message
console.log(`Message role: ${messageContent.role}, content: ${messageContent.content}`);
//#endregion

//#region Message Creation and Stream Setup
// Add a user message requesting a joke
const message = await client.agents.createMessage(thread.id, messageContent);

console.log(`Created message, message ID: ${message.id}`);
// show role and content of the message
// Access the message content correctly
console.log(
  `Message role: ${message.role}, content: ${
    message.content[0]?.type === "text" ? message.content[0].text.value : "No text content"
  }`
);

// Create a run with streaming enabled to get real-time responses
const streamEventMessages = await client.agents
  .createRun(thread.id, agent.id)
  .stream();
//#endregion

//#region Stream Event Handling
// Process streaming events as they arrive
for await (const eventMessage of streamEventMessages) {
  switch (eventMessage.event) {
    case RunStreamEvent.ThreadRunCreated:
      // Run has started, display initial status
      console.log(
        `ThreadRun status: ${(eventMessage.data as ThreadRunOutput).status}`
      );
      break;
    case MessageStreamEvent.ThreadMessageDelta:
      {
        // Process incremental text updates from the agent's response
        const messageDelta = eventMessage.data as MessageDeltaChunk;
        messageDelta.delta.content.forEach((contentPart) => {
          if (contentPart.type === "text") {
            const textContent = contentPart as MessageDeltaTextContent;
            const textValue = textContent.text?.value || "No text";
            console.log(`Text delta received:: ${textValue}`);
          }
        });
      }
      break;

    case RunStreamEvent.ThreadRunCompleted:
      // Run has finished successfully
      console.log("Thread Run Completed");
      break;
    case ErrorEvent.Error:
      // An error occurred during streaming
      console.log(`An error occurred. Data ${eventMessage.data}`);
      break;
    case DoneEvent.Done:
      // Stream is complete
      console.log("Stream completed.");
      break;
  }
}
//#endregion

//#region Cleanup
// Delete the agent to clean up resources
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID : ${agent.id}`);

// Note: In a real application, you might also want to delete the thread:
// await client.agents.deleteThread(thread.id);
// console.log(`Deleted thread, thread ID : ${thread.id}`);
//#endregion
