/**
 * Azure AI Agents Demo: Code Interpreter Example
 * 
 * This example demonstrates how to use the Code Interpreter tool with Azure AI Agents to analyze
 * data from a CSV file and generate visualizations.
 */

//#region Imports
import type { MessageImageFileContentOutput, MessageTextContentOutput } from "@azure/ai-projects";
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { ToolUtility } from "@azure/ai-projects";
import fs from "fs";

import "dotenv/config";
//#endregion

//#region Configuration
// Set up file path and connection details
const fileName = "Texas_State_Expenditures_By_County_2023.csv";
const filePath = "files/" + fileName;

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

//#region File Upload and Tool Setup
// Read and upload the CSV file to Azure AI Agent service
const localFileStream = fs.createReadStream(filePath);
const file = await client.agents.uploadFile(localFileStream, "assistants", {
  fileName: fileName,
});

console.log(`Uploaded file, ID: ${file.id}`);
// Commented vector store setup - alternative approach using file search instead of code interpreter
// const vectorStore = await client.agents.createVectorStore({
//   fileIds: [file.id],
//   name: `vector_store_${file.id}`,
// });
// console.log(`Created vector store, ID: ${vectorStore.id}`);
// const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);

// Create a code interpreter tool with access to the uploaded file
const codeInterpreterTool = ToolUtility.createCodeInterpreterTool([file.id]);
//#endregion

//#region Agent Creation
// Create an AI Agent with Code Interpreter capabilities
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "Texas-Expenditure-Agent",
  instructions: `You are a helpful agent that can help fetch data from files you know about. make everything fun and hilarious. crack jokes. make it simple to understand

- Use the **code interpreter** to generate table, charts, graphs, or analytical visualizations.
    - Always **test and display visualization code**, retrying if an error occurs.
    - When the user requests trend analysis, **use charts or graphs** to illustrate the data.
    - Always include relevant file path annotations in your response.
    - Visualization file format requirements:
        - Save all visualizations as **.png files**.
        - Ensure images are always created in **PNG format**.
        `,
  tools: [codeInterpreterTool.definition],
  toolResources: codeInterpreterTool.resources,
});
//#endregion

//#region Thread and Message Creation
// Create a conversation thread
const thread = await client.agents.createThread();

// Add a user message to the thread with the analysis request
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "create a bar chart of the top 10 counties with the highest expenditures",
});
console.log(`Created message, message ID: ${message.id}`);

// Create and start a run of the agent
let run = await client.agents.createRun(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Poll until the agent run completes processing
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}

//#region Message Retrieval and Display
// Retrieve all messages from the conversation thread
const messages = await client.agents.listMessages(thread.id);

// Display text content from messages in reverse order (newest first)
for (const dataPoint of messages.data.reverse()) {
  console.log(`${dataPoint.createdAt} - ${dataPoint.role}:`);
  for (const contentItem of dataPoint.content) {
    if (contentItem.type === "text") {
      console.log((contentItem as MessageTextContentOutput).text.value);
    }
  }
}
//#endregion

//#region Image Processing
// Download any generated image files
console.log("Looking for image files...");
const fileIds: string[] = [];
for (const data of messages.data) {
  for (const content of data.content) {
    // Cast to MessageImageFileContentOutput to handle image files
    const imageFile = (content as MessageImageFileContentOutput).imageFile;
    if (imageFile) {
      // Store file ID for cleanup later
      fileIds.push(imageFile.fileId);
      
      // Get the filename of the image
      const imageFileName = (await client.agents.getFile(imageFile.fileId))
        .filename;

      // Download file content as stream
      const fileContent = await (
        await client.agents.getFileContent(imageFile.fileId).asNodeStream()
      ).body;
      if (fileContent) {
        // Collect all chunks into a single buffer
        const chunks: Buffer[] = [];
        for await (const chunk of fileContent) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        // Ensure downloads directory exists
        if (!fs.existsSync("./downloads")) {
          fs.mkdirSync("./downloads", { recursive: true });
        }

        // Save image file to downloads directory
        fs.writeFileSync(`./downloads/${imageFileName}`, buffer);
      } else {
        console.error(
          "Failed to retrieve file content: fileContent is undefined"
        );
      }
      console.log(`Saved image file to: ${imageFileName}`);
    }
  }
}
//#endregion

//#region Cleanup
// Delete remote files to clean up storage
for (const fileId of fileIds) {
  console.log(`Deleting remote image file with ID: ${fileId}`);
  await client.agents.deleteFile(fileId);
}

// Delete the thread to clean up resources
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID : ${thread.id}`);

// Uncomment to delete the agent when finished
// await client.agents.deleteAgent(agent.id);
// console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion

// await client.agents.deleteAgent(agent.id);
// console.log(`Deleted agent, agent ID: ${agent.id}`);