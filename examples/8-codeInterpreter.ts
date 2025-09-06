/**
 * Azure AI Agents Demo: Code Interpreter Example
 * 
 * This example demonstrates how to use the Code Interpreter tool with Azure AI Agents to analyze
 * data from a CSV file and generate visualizations.
 */

//#region Imports
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import fs from "fs";

import "dotenv/config";
//#endregion

//#region Configuration
// Set up file path and connection details
const fileName = "Texas_State_Expenditures_By_County_2023.csv";
const filePath = "files/" + fileName;

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

//#region File Upload and Tool Setup
// Read and upload the CSV file to Azure AI Agent service
const localFileStream = fs.createReadStream(filePath);
const file = await client.agents.files.upload(localFileStream, "assistants", {
  fileName: fileName,
});

console.log(`Uploaded file, ID: ${file.id}`);

// Create a code interpreter tool with access to the uploaded file
const codeInterpreterTool = {
  type: "code_interpreter"
};
//#endregion

//#region Agent Creation
// Create an AI Agent with Code Interpreter tool capabilities
const agent = await client.agents.createAgent("gpt-4o-mini", {
  name: "csv-data-analyst",
  instructions: `You have access to CSV file data. Please help analyze the data, perform calculations, and create visualizations. You can execute Python code to process the data and generate insights.`,
  tools: [codeInterpreterTool],
  toolResources: {
    codeInterpreter: {
      fileIds: [file.id]
    }
  },
});

console.log(`Created agent, agent ID: ${agent.id}`);
//#endregion

//#region Thread and Message Creation
const thread = await client.agents.threads.create();

const message = await client.agents.messages.create(thread.id, "user", 
  "Could you analyze the Texas expenditures data and create a visualization showing the top 10 counties by expenditure amount? Include total amounts."
);

console.log(`Created message, message ID: ${message.id}`);
//#endregion

//#region Run Execution
// Execute the run to process the message
console.log("Starting run to analyze data...");
let run = await client.agents.runs.create(thread.id, agent.id);
console.log(`Created run, run ID: ${run.id}`);

// Wait for completion
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  run = await client.agents.runs.get(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}
//#endregion

//#region Result Processing
const messages = await client.agents.messages.list(thread.id);
const messagesArray = [];
for await (const msg of messages) {
  messagesArray.push(msg);
}

console.log(`Retrieved ${messagesArray.length} messages`);
console.log("Analysis completed - agent provided insights on the Texas expenditures data.");

// Simple message content display
for (const msg of messagesArray) {
  if (msg.role === "assistant") {
    console.log(`Assistant response available with ${msg.content.length} content items`);
    break;
  }
}
//#endregion

//#region Cleanup
// Clean up resources
await client.agents.files.delete(file.id);
console.log(`Deleted file, file ID: ${file.id}`);

await client.agents.threads.delete(thread.id);
console.log(`Deleted thread, thread ID: ${thread.id}`);

await client.agents.deleteAgent(agent.id);
console.log(`Deleted agent, agent ID: ${agent.id}`);
//#endregion