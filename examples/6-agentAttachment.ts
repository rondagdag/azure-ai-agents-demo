/**
 * Azure AI Agents Demo: File Attachment Example
 * 
 * This example demonstrates how to create an AI Agent with access to a PDF document
 * using file search capabilities to answer questions based on the document content.
 */

//#region Imports
import type { MessageTextContentOutput } from "@azure/ai-projects";
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { ToolUtility } from "@azure/ai-projects";
import fs from "fs";

import "dotenv/config";
//#endregion

//#region Configurationm

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

//#region File Upload and Vector Store Setup
// Define the PDF file to use and its path
const fileName = "azure-ai-services-agents.pdf";
const filePath = "files/" + fileName;
// Create a readable stream from the PDF file
const localFileStream = fs.createReadStream(filePath);

// Upload the file to Azure AI Agent service
const file = await client.agents.uploadFile(localFileStream, "assistants", {
  fileName: fileName,
});
console.log(`Uploaded file, ID: ${file.id}`);

// Create a vector store from the uploaded file for semantic search capabilities
const vectorStore = await client.agents.createVectorStore({
  fileIds: [file.id],
  name: `vector_store_${file.id}`,
});
console.log(`Created vector store, ID: ${vectorStore.id}`);

// Create a file search tool that provides access to the vector store
const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);
//#endregion

//#region Agent Creation
// Create an AI Agent with file search capabilities
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "Azure-AI-Agent-Service-Tutor",
  instructions: "You are helpful agent that can help fetch data from files you know about. make everything fun and hilarious. crack jokes. make it simple to understand",
  tools: [fileSearchTool.definition],
  toolResources: fileSearchTool.resources,
});
//#endregion

//#region Thread and Message Creation
// Create a conversation thread for the interaction
const thread = await client.agents.createThread();

// Add a user message inquiring about available models
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "what are the available models to use?",
});
console.log(`Created message, message ID: ${message.id}`);

// Start a run with the agent to process the question
let run = await client.agents.createRun(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the agent run completes processing
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Result Processing
// Retrieve messages from the thread to get the agent's response
const messages = await client.agents.listMessages(thread.id);

// Display the text content of the response
console.log(
  `Message ${message.id} contents: ${
    (messages.data[0].content[0] as MessageTextContentOutput).text.value
  }`
);

//#endregion

//#region Cleanup
// Delete all resources in reverse order of creation
// Delete the vector store first
await client.agents.deleteVectorStore(vectorStore.id);
console.log(`Deleted vector store, vector store ID: ${vectorStore.id}`);

// Delete the uploaded file
await client.agents.deleteFile(file.id);
console.log(`Deleted file, file ID: ${file.id}`);

// Delete the conversation thread
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Delete the agent
await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion