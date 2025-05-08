import { AIProjectsClient, MessageTextContentOutput } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

const connectionString =
  process.env["AI_FOUNDRY_PROJECT_CONNECTION_STRING"] ||
  "<project connection string>";

const client = AIProjectsClient.fromConnectionString(
  connectionString || "",
  new DefaultAzureCredential()
);

// Create agent
const agentId = process.env["AI_AGENT_ID"];
console.log(`Created agent, agent ID: ${agentId}`);

// Create thread
const thread = await client.agents.createThread();
console.log(`Created thread, thread ID: ${thread.id}`);

// Create message
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "what are the available models to use?",
});
console.log(`Created message, message ID: ${message.id}`);

// Create run
let run = await client.agents.createRun(thread.id, agentId);
console.log(`Created run, run ID: ${run.id}`);

// Wait for run to complete
while (["queued", "in_progress", "requires_action"].includes(run.status)) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
  console.log(`Run status: ${run.status}`);
}

// Get run result
const messages = await client.agents.listMessages(thread.id);
console.log(
  `Message ${message.id} contents: ${
    (messages.data[0].content[0] as MessageTextContentOutput).text.value
  }`
);

// Clean up
await client.agents.deleteThread(thread.id);
console.log(`Deleted thread, thread ID: ${thread.id}`);
