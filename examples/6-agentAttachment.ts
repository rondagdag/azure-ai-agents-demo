/**
 * Azure AI Agents Demo: File Attachment Example
 * 
 * This example demonstrates how to create an AI Agent with access to a PDF document
 * using file search capabilities to answer questions based on the document content.
 */

//#region Imports
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import fs from "fs";

import "dotenv/config";
//#endregion

//#region Configurationm

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

//#region File Upload and Vector Store Setup
// Define the PDF file to use and its path
const fileName = "azure-ai-foundry.pdf";
const filePath = "files/" + fileName;
// Create a readable stream from the PDF file
const localFileStream = fs.createReadStream(filePath);

// Upload the file to Azure AI Agent service
const file = await client.agents.files.upload(localFileStream, "assistants", {
  fileName: fileName,
});
console.log(`Uploaded file, ID: ${file.id}`);

// Create a vector store from the uploaded file for semantic search capabilities
const vectorStore = await client.agents.vectorStores.create({
  fileIds: [file.id],
  name: `vector_store_${file.id}`,
});
console.log(`Created vector store, ID: ${vectorStore.id}`);

// Create a file search tool that provides access to the vector store
// Note: ToolUtility is not available in new SDK, using manual tool definition
const fileSearchTool = {
  type: "file_search",
  file_search: {
    vector_store_ids: [vectorStore.id]
  }
};
//#endregion

//#region Agent Creation
// Create an AI Agent with file search capabilities
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "Azure-AI-Agent-Service-Tutor",
  instructions: "You are helpful agent that can help fetch data from files you know about. make everything fun and hilarious. crack jokes. make it simple to understand",
  tools: [fileSearchTool],
  toolResources: {
    fileSearch: {
      vectorStoreIds: [vectorStore.id]
    }
  },
});
//#endregion

//#region Thread and Message Creation
// Create a conversation thread for the interaction
const thread = await client.agents.threads.create();

const userMessage = {
  role: "user",
  content: "what are the available models to use?",
};
// show role and content of the message
console.log(`Message role: ${userMessage.role}, content: ${userMessage.content}`);
// Add a user message inquiring about available models
const message = await client.agents.messages.create(thread.id, "user", userMessage.content);
console.log(`Created message, message ID: ${message.id}`);
// show role and content of the message
console.log(`Message role: ${message.role}`);

// Start a run with the agent to process the question
let run = await client.agents.runs.create(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the agent run completes processing
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.runs.get(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Result Processing
// Retrieve messages from the thread to get the agent's response
const messages = await client.agents.messages.list(thread.id);

// Convert async iterator to array and display the response
const messagesArray = [];
for await (const msg of messages) {
  messagesArray.push(msg);
}

console.log(`Retrieved ${messagesArray.length} messages`);
if (messagesArray.length > 0) {
  console.log(`Agent provided a response to the query about available models.`);
}
//#endregion

//#region Cleanup
// Delete all resources in reverse order of creation
// Delete the vector store first
await client.agents.vectorStores.delete(vectorStore.id);
console.log(`Deleted vector store, vector store ID: ${vectorStore.id}`);

// Delete the uploaded file
await client.agents.files.delete(file.id);
console.log(`Deleted file, file ID: ${file.id}`);

// Delete the conversation thread
await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Delete the agent
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion