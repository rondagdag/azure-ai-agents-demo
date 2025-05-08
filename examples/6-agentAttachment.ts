import type { MessageTextContentOutput } from "@azure/ai-projects";
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { ToolUtility } from "@azure/ai-projects";
import fs from "fs";

import "dotenv/config";

const filePath = "../files/azure-ai-services-agents.pdf";

const connectionString =
  process.env["AI_FOUNDRY_PROJECT_CONNECTION_STRING"] ||
  "<project connection string>";

const client = AIProjectsClient.fromConnectionString(
  connectionString || "",
  new DefaultAzureCredential()
);

const localFileStream = fs.createReadStream(filePath);
const file = await client.agents.uploadFile(localFileStream, "assistants", {
  fileName: "sample_file_for_upload.txt",
});
console.log(`Uploaded file, ID: ${file.id}`);
const vectorStore = await client.agents.createVectorStore({
  fileIds: [file.id],
  name: `vector_store_${file.id}`,
});
console.log(`Created vector store, ID: ${vectorStore.id}`);
const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);

const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "Azure-AI-Agent-Service-Tutor",
  instructions: "You are helpful agent that can help fetch data from files you know about. make everything fun and hilarious. crack jokes. make it simple to understand",
  tools: [fileSearchTool.definition],
  toolResources: fileSearchTool.resources,
});


const thread = await client.agents.createThread();

const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "what are the available models to use?",

});
console.log(`Created message, message ID: ${message.id}`);

// Create run
let run = await client.agents.createRun(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Wait for run to complete
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}

const messages = await client.agents.listMessages(thread.id);
console.log(
  `Message ${message.id} contents: ${
    (messages.data[0].content[0] as MessageTextContentOutput).text.value
  }`
);

await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);