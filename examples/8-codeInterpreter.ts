/**
 * Azure AI Agents Demo: Code Interpreter Example
 * 
 * This example demonstrates how to use the Code Interpreter tool with Azure AI Agents to analyze
 * data from a CSV file and generate visualizations.
 */

//#region Imports
import type { 
  MessageImageFileContent, 
  MessageTextAnnotationUnion, 
  MessageTextContent,
  MessageTextFilePathAnnotation,
  ThreadMessage 
} from "@azure/ai-agents";
import { AgentsClient, ToolUtility, isOutputOfType } from "@azure/ai-agents";
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import fs from "fs";
import path from "path";

import "dotenv/config";
//#endregion

/**
 * Simple wait for file processing to prevent vector store timeout
 */
async function waitForFileProcessing(client: AgentsClient, fileId: string): Promise<void> {
  try {
    await client.files.get(fileId);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Buffer for vector store processing
    console.log("✓ File ready");
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Fallback delay
    console.log("✓ File processing timeout, continuing...");
  }
}

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
  try {
    //#region File Upload and Tool Setup
  // Read and upload the CSV file to Azure AI Agent service
  const localFileStream = fs.createReadStream(filePath);
  const localFile = await client.files.upload(localFileStream, "assistants", {
    fileName: fileName,
  });

  console.log(`Uploaded file, ID: ${localFile.id}`);
  
  // Wait for file to be processed in vector store
  console.log("⏳ Waiting for file to be processed...");
  await waitForFileProcessing(client, localFile.id);
  console.log("✓ File processing completed!");

  // Commented vector store setup - alternative approach using file search instead of code interpreter
  // const vectorStore = await client.vectorStores.create({
  //   fileIds: [file.id],
  //   name: `vector_store_${file.id}`,
  // });
  // console.log(`Created vector store, ID: ${vectorStore.id}`);
  // const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);

  // Create a code interpreter tool (no file restriction - like C# version)
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool();
  //#endregion

  //#region Agent Creation
  // Create an AI Agent with Code Interpreter capabilities
  const agent = await client.createAgent("gpt-4o-mini", {
    name: "Texas-Expenditure-Agent",
    instructions: `You are a data analysis assistant. When working with large CSV files:
1. Load data efficiently using pandas
2. Handle memory limitations by processing data in chunks if needed
3. Always show a data summary first before creating visualizations
4. Create simple, clear charts and save as PNG files
5. If you encounter errors, try simpler approaches or smaller data samples

Make everything fun and hilarious. Crack jokes. Make it simple to understand.
- Use the **code interpreter** to generate table, charts, graphs, or analytical visualizations.
- Always **test and display visualization code**, retrying if an error occurs.
- When the user requests trend analysis, **use charts or graphs** to illustrate the data.
- Always include relevant file path annotations in your response.
- Visualization file format requirements:
    - Save all visualizations as **.png files**.
    - Ensure images are always created in **PNG format**.`,
    tools: [codeInterpreterTool.definition],
    toolResources: codeInterpreterTool.resources,
  });
  //#endregion

  //#region Thread and Message Creation

  // Create a conversation thread
  const thread = await client.threads.create();

  // Add a user message to the thread with the analysis request
  const message = await client.messages.create(
    thread.id, 
    "user", 
    "Hello! I've uploaded a CSV file with Texas state expenditures data. Can you first analyze the data and show me a summary of what's in the file?",
    {
      attachments: [
        {
          fileId: localFile.id,
          tools: [{ type: "code_interpreter" }]
        }
      ]
    }
  );
  console.log(`Created message, message ID: ${message.id}`);
  // show role and content of the message
  console.log(`Message role: ${message.role}, content: ${message.content}`);

  // Additional wait to ensure vector store is ready for the attachment
  console.log("⏳ Allowing additional time for vector store processing...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Create and start a run of the agent
  let run = await client.runs.create(thread.id, agent.id);
  console.log(`Created run, run ID: ${run.id}`);

  // Poll until the agent run completes processing
  while (["queued", "in_progress", "requires_action"].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    run = await client.runs.get(thread.id, run.id);
    console.log(`Run status: ${run.status}`);
  }

  console.log(`✓ Completed: ${run.status}`);

  // Check if run failed and provide detailed error information
  if (run.status === "failed") {
    console.log(`❌ Run failed with status: ${run.status}`);
    if (run.lastError) {
      console.log(`Error Code: ${run.lastError.code}`);
      console.log(`Error Message: ${run.lastError.message}`);
    }
    
    // Still try to get messages to see what happened
    console.log("\n🔍 Checking conversation for error details...");
  } else if (run.status === "completed") {
    // First run completed successfully, now ask for the chart
    console.log("\n📊 Data analysis completed! Now requesting chart generation...");
    
    const chartMessage = await client.messages.create(
      thread.id,
      "user", 
      "Now please create a simple bar chart showing just the top 5 counties by total expenditure. Use only the top 5 to keep it simple and save it as a PNG file.",
      {
        attachments: [
          {
            fileId: localFile.id,
            tools: [{ type: "code_interpreter" }]
          }
        ]
      }
    );
    console.log(`Created chart request message, ID: ${chartMessage.id}`);
    
    // Create and run the chart generation
    let chartRun = await client.runs.create(thread.id, agent.id);
    console.log(`Created chart run, run ID: ${chartRun.id}`);
    
    // Poll until the chart run completes
    while (["queued", "in_progress", "requires_action"].includes(chartRun.status)) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      chartRun = await client.runs.get(thread.id, chartRun.id);
      console.log(`Chart run status: ${chartRun.status}`);
    }
    
    console.log(`✓ Chart generation completed: ${chartRun.status}`);
    
    if (chartRun.status === "failed") {
      console.log(`❌ Chart generation failed with status: ${chartRun.status}`);
      if (chartRun.lastError) {
        console.log(`Error Code: ${chartRun.lastError.code}`);
        console.log(`Error Message: ${chartRun.lastError.message}`);
      }
    }
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
      console.log(`- Content type: ${contentItem.type}`);
      console.log(`  Full content: ${JSON.stringify(contentItem)}`);
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
  //await client.files.delete(localFile.id);
  console.log(`Deleted file, file ID: ${localFile.id}`);

  // Delete the thread to clean up resources
  // await client.threads.delete(thread.id);
  console.log(`Deleted thread, thread ID : ${thread.id}`);

  // Delete the agent when finished
  //await client.deleteAgent(agent.id);
  console.log(`Deleted agent, agent ID: ${agent.id}`);
  
  console.log("🎉 Demo completed!");
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

/**
 * Download image files from messages using proper streaming approach
 */
async function downloadImages(client: AgentsClient, messages: ThreadMessage[]) {
  console.log("\n🏞️ Looking for image files...");
  const fileIds: string[] = [];
  
  for (const data of messages) {
    for (const content of data.content) {
        const messageContent = (content as MessageTextContent);
        
        const annotations = messageContent.text.annotations;
        // data looks like this
        //  "annotations": [ {"type":"file_path","text":"sandbox:/mnt/data/top_counties_expenditures.png","filePath":{"fileId":"assistant-HdtgAHTZMVZNV6q8j6fTGC"},"startIndex":275,"endIndex":322}]
        // find file path annotation and extract filepath and fileId
        let imageFile: MessageImageFileContent | undefined = undefined;
        if (annotations && annotations.length > 0) {
          for (const annotation of annotations) {
            if (isOutputOfType<MessageTextAnnotationUnion>(annotation, "file_path")) {
              const imageFile = (annotation as MessageTextFilePathAnnotation).filePath;
              fileIds.push(imageFile.fileId);
              console.log(`\n Found image file with ID: ${imageFile.fileId}`);
              try {
                  // Get the filename of the image
                  const fileInfo = await client.files.get(imageFile.fileId);
                  const imageFileName = path.basename(fileInfo.filename);
                  console.log(`File info filename: ${fileInfo.filename}`);
                  console.log(`Extracted basename: ${imageFileName}`);
                  
                  // Get file content using the StreamableMethod with asNodeStream()
                  const fileContentStream = client.files.getContent(imageFile.fileId);
                  const streamResponse = await fileContentStream.asNodeStream();
                  
                  if (!streamResponse.body) {
                    throw new Error("Stream response body is undefined");
                  }
                  
                  // Read the stream to get the actual content
                  const chunks: Buffer[] = [];
                  
                  streamResponse.body.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                  });
                  
                  const buffer = await new Promise<Buffer>((resolve, reject) => {
                    streamResponse.body!.on('end', () => {
                      resolve(Buffer.concat(chunks));
                    });
                    
                    streamResponse.body!.on('error', reject);
                  });

                  // Ensure downloads directory exists
                  if (!fs.existsSync("./downloads")) {
                    fs.mkdirSync("./downloads", { recursive: true });
                  }

                  fs.writeFileSync(`./downloads/${imageFileName}`, buffer);
                  console.log(`Saved image file to: ./downloads/${imageFileName}`);
              





                  // // Download file content directly
                  // const fileContent = await client.files.getContent(imageFile.fileId);
                  
                  // if (fileContent) {
                  //   // Ensure downloads directory exists
                  //   if (!fs.existsSync("./downloads")) {
                  //     fs.mkdirSync("./downloads", { recursive: true });
                  //   }
                    
                  //   // Convert content to Buffer if it's not already
                  //   let buffer: Buffer;
                  //   if (typeof fileContent === 'string') {
                  //     buffer = Buffer.from(fileContent, 'binary');
                  //   } else if (fileContent instanceof Uint8Array) {
                  //     buffer = Buffer.from(fileContent);
                  //   } else {
                  //     buffer = fileContent as Buffer;
                  //   }
                    
                  //   fs.writeFileSync(`./downloads/${imageFileName}`, buffer);
                  //   console.log(`Saved image file to: ./downloads/${imageFileName}`);
                  // } else {
                  //   console.error(`Failed to retrieve file content for ${imageFile.fileId}: fileContent is undefined`);
                  // }
                  
              } catch (error) {
                console.error(`Error downloading image file ${imageFile.fileId}:`, error);
              }
            }
          }
        }
      }
    }
}


main().catch((err) => {
  console.error("Error running code interpreter example:", err);
});