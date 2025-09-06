/**
 * Azure AI Agents Demo: Code Interpreter Example
 * 
 * This example demonstrates how to use the Code Interpreter tool with Azure AI Agents to analyze
 * data from a CSV file and generate visualizations.
 */

//#region Imports
import type { 
  MessageImageFileContent, 
  MessageTextContent,
  ThreadMessage 
} from "@azure/ai-agents";
import { AgentsClient, ToolUtility, isOutputOfType } from "@azure/ai-agents";
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
  "<project endpoint string>";

// Initialize AgentsClient directly with endpoint and Azure credentials
const client = new AgentsClient(endpoint, new DefaultAzureCredential());
//#endregion

async function main() {
  //#region File Upload and Tool Setup
  // Read and upload the CSV file to Azure AI Agent service
  const localFileStream = fs.createReadStream(filePath);
  const localFile = await client.files.upload(localFileStream, "assistants", {
    fileName: fileName,
  });

  console.log(`Uploaded file, ID: ${localFile.id}`);
  // Commented vector store setup - alternative approach using file search instead of code interpreter
  // const vectorStore = await client.vectorStores.create({
  //   fileIds: [file.id],
  //   name: `vector_store_${file.id}`,
  // });
  // console.log(`Created vector store, ID: ${vectorStore.id}`);
  // const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);

  // Create a code interpreter tool with access to the uploaded file
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool([localFile.id]);
  //#endregion

  //#region Agent Creation
  // Create an AI Agent with Code Interpreter capabilities
  const agent = await client.createAgent("gpt-4o-mini", {
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
  const thread = await client.threads.create();

  // Add a user message to the thread with the analysis request
  const message = await client.messages.create(thread.id, "user", "create a bar chart of the top 10 counties with the highest expenditures");
  console.log(`Created message, message ID: ${message.id}`);
  // show role and content of the message
  console.log(`Message role: ${message.role}, content: ${message.content}`);

  // Create and start a run of the agent
  let run = await client.runs.create(thread.id, agent.id);
  console.log(`Created run, run ID: ${run.id}`);

  // Poll until the agent run completes processing
  while (["queued", "in_progress", "requires_action"].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await client.runs.get(thread.id, run.id);
    console.log(`Run status: ${run.status}`);
  }

  // Retrieve all messages from the conversation thread
  const messages = client.messages.list(thread.id);
  const messagesArray: ThreadMessage[] = [];

  // Collect all messages into an array for processing
  for await (const dataPoint of messages) {
    messagesArray.push(dataPoint);
  }

  console.log("\n📝 Conversation Transcript:");
  // Display text content from messages in reverse order (newest first)
  for (let i = messagesArray.length - 1; i >= 0; i--) {
    const dataPoint = messagesArray[i];
    console.log(`${dataPoint.createdAt} - ${dataPoint.role}:`);
    for (const contentItem of dataPoint.content) {
      if (contentItem.type === "text") {
        console.log((contentItem as MessageTextContent).text.value);
      } else if (contentItem.type === "image_file") {
        const imageFile = (contentItem as MessageImageFileContent).imageFile;
        if (imageFile) {
          console.log(`Image File ID: ${imageFile.fileId}`);
        }
      } else {
        console.log(`Other Content Type: ${contentItem.type}`);
      }
    }
  }

  // Download any generated image files using proper streaming
  await downloadImages(client, messagesArray);

  // Delete the original file from the agent to free up space (note: this does not delete your version of the file)
  await client.files.delete(localFile.id);
  console.log(`Deleted file, file ID: ${localFile.id}`);

  // Delete the thread to clean up resources
  // await client.threads.delete(thread.id);
  console.log(`Deleted thread, thread ID : ${thread.id}`);

  // Delete the agent when finished
  //await client.deleteAgent(agent.id);
  console.log(`Deleted agent, agent ID: ${agent.id}`);
}

/**
 * Download image files from messages using proper streaming approach
 */
async function downloadImages(client: AgentsClient, messages: ThreadMessage[]) {
  console.log("\n🏞️ Looking for image files...");
  const fileIds: string[] = [];
  
  for (const data of messages) {
    for (const content of data.content) {
      if (content.type === "image_file") {
        const imageFile = (content as MessageImageFileContent).imageFile;
        if (imageFile) {
          fileIds.push(imageFile.fileId);
          console.log(`\n Found image file with ID: ${imageFile.fileId}`);
          
          try {
            // Get the filename of the image
            const fileInfo = await client.files.get(imageFile.fileId);
            const imageFileName = fileInfo.filename;
            
            // Download file content directly
            const fileContent = await client.files.getContent(imageFile.fileId);
            
            if (fileContent) {
              // Ensure downloads directory exists
              if (!fs.existsSync("./downloads")) {
                fs.mkdirSync("./downloads", { recursive: true });
              }
              
              // Convert content to Buffer if it's not already
              let buffer: Buffer;
              if (typeof fileContent === 'string') {
                buffer = Buffer.from(fileContent, 'binary');
              } else if (fileContent instanceof Uint8Array) {
                buffer = Buffer.from(fileContent);
              } else {
                buffer = fileContent as Buffer;
              }
              
              fs.writeFileSync(`./downloads/${imageFileName}`, buffer);
              console.log(`Saved image file to: ./downloads/${imageFileName}`);
            } else {
              console.error(`Failed to retrieve file content for ${imageFile.fileId}: fileContent is undefined`);
            }
            
          } catch (error) {
            console.error(`Error downloading image file ${imageFile.fileId}:`, error);
          }
        }
      }
    }
  }
  
  // Delete remote files to clean up storage
  for (const fileId of fileIds) {
    console.log(`Deleting remote image file with ID: ${fileId}`);
    try {
      await client.files.delete(fileId);
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
    }
  }
}

main().catch((err) => {
  console.error("Error running code interpreter example:", err);
});