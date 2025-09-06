import "dotenv/config";
import { AgentsClient } from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";
import { ToolUtility } from "@azure/ai-agents";

const projectEndpoint = process.env["AZURE_AI_PROJECT_ENDPOINT_STRING"] || "https://aifoundry3058.services.ai.azure.com/api/projects/project3058";

async function main() {
  const client = new AgentsClient(projectEndpoint, new DefaultAzureCredential());

  console.log("Creating minimal chart test agent...");
  
  // Create Code Interpreter tool (no file restriction)
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool();

  // Create agent
  const agent = await client.createAgent("gpt-4o-mini", {
    name: "Chart Test Agent",
    instructions: "You are a helpful assistant that creates simple charts. Create a simple bar chart with matplotlib and save it as PNG.",
    tools: [codeInterpreterTool.definition],
    toolResources: codeInterpreterTool.resources,
  });
  console.log(`Created agent, ID: ${agent.id}`);

  // Create thread
  const thread = await client.threads.create();
  console.log(`Created thread, ID: ${thread.id}`);

  // Send chart request
  const message = await client.messages.create(
    thread.id, 
    "user", 
    "Create a simple bar chart with these data points and save as PNG: Austin: 100, Houston: 90, Dallas: 80, San Antonio: 70, Fort Worth: 60"
  );
  console.log(`Created message, ID: ${message.id}`);

  // Create and start run
  let run = await client.runs.create(thread.id, agent.id);
  console.log(`Created run, ID: ${run.id}`);

  // Poll until completion
  while (["queued", "in_progress", "requires_action"].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    run = await client.runs.get(thread.id, run.id);
    console.log(`Run status: ${run.status}`);
  }

  console.log(`✓ Final status: ${run.status}`);
  
  if (run.status === "failed") {
    console.log(`❌ Chart generation failed`);
    console.log(`Error Code: ${run.lastError?.code}`);
    console.log(`Error Message: ${run.lastError?.message}`);
  }

  // Get messages
  const messages = await client.messages.list(thread.id);
  console.log("\n📝 Conversation:");
  for await (const msg of messages) {
    if (typeof msg.content === 'string') {
      console.log(`${msg.role}: ${msg.content}`);
    } else if (Array.isArray(msg.content)) {
      msg.content.forEach((item: any, index: number) => {
        console.log(`${msg.role} [${index}]: ${JSON.stringify(item)}`);
      });
    } else {
      console.log(`${msg.role}: ${JSON.stringify(msg.content)}`);
    }
  }

  // Cleanup (commented like original)
  // await client.deleteAgent(agent.id);
  // await client.threads.delete(thread.id);
  console.log("🎉 Test completed!");
}

main().catch(console.error);