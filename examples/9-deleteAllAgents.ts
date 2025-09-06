/**
 * Azure AI Agents Demo: Delete All Agents Example
 * 
 * This example demonstrates how to safely delete all existing Azure AI Agents.
 * It connects to Azure AI Foundry, lists all agents, and prompts for confirmation
 * before deleting each one individually.
 */

//#region Imports
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import * as readline from "readline";
import "dotenv/config";
//#endregion

//#region Configuration
// Load endpoint from environment variables or use default placeholder
const endpoint =
  process.env["AZURE_AI_PROJECT_ENDPOINT_STRING"] ||
  "<project endpoint>";

// Initialize AI Projects client with endpoint and Azure credentials
const client = new AIProjectClient(
  endpoint,
  new DefaultAzureCredential()
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
//#endregion

//#region Helper Functions
/**
 * Prompts user for confirmation with a yes/no question
 */
function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      const response = answer.toLowerCase().trim();
      resolve(response === 'y' || response === 'yes');
    });
  });
}

/**
 * Displays agent information in a formatted way
 */
function displayAgentInfo(agent: any, index: number) {
  console.log(`\n--- Agent ${index + 1} ---`);
  console.log(`ID: ${agent.id}`);
  console.log(`Name: ${agent.name || 'Unnamed'}`);
  console.log(`Model: ${agent.model || 'Unknown'}`);
  console.log(`Created: ${agent.createdAt ? new Date(agent.createdAt).toLocaleString() : 'Unknown'}`);
  console.log(`Instructions: ${agent.instructions ? agent.instructions.substring(0, 100) + '...' : 'No instructions'}`);
  
  if (agent.tools && agent.tools.length > 0) {
    console.log(`Tools: ${agent.tools.map((tool: any) => tool.type).join(', ')}`);
  }
}

/**
 * Safely deletes an agent with error handling
 */
async function deleteAgentSafely(agentId: string, agentName: string): Promise<boolean> {
  try {
    await client.agents.deleteAgent(agentId);
    console.log(`✅ Successfully deleted agent: ${agentName} (${agentId})`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to delete agent ${agentName} (${agentId}): ${error.message}`);
    return false;
  }
}
//#endregion

//#region Main Function
async function main() {
  console.log("🔍 Connecting to Azure AI Foundry Agent Service...");
  
  try {
    // Test connection by attempting to list agents
    console.log("📋 Retrieving all existing agents...");
    
    // Get list of all agents using the correct listAgents method
    const agentsIterator = client.agents.listAgents();
    const agents = [];
    
    for await (const agent of agentsIterator) {
      agents.push(agent);
    }

    if (agents.length === 0) {
      console.log("✨ No agents found. Nothing to delete!");
      rl.close();
      return;
    }

    console.log(`\n📊 Found ${agents.length} agent(s) in your Azure AI Foundry workspace:`);
    
    // Display all agents
    agents.forEach((agent, index) => {
      displayAgentInfo(agent, index);
    });

    console.log("\n" + "=".repeat(60));
    
    // Ask for overall confirmation
    const shouldProceed = await askConfirmation(
      `⚠️  Are you sure you want to proceed with reviewing ${agents.length} agent(s) for deletion?`
    );

    if (!shouldProceed) {
      console.log("🛑 Operation cancelled by user.");
      rl.close();
      return;
    }

    console.log("\n🗑️  Starting agent deletion process...");
    console.log("📝 You will be asked to confirm each agent deletion individually.");
    
    let deletedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Delete agents - always ask for individual confirmation
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const agentName = agent.name || 'Unnamed Agent';
      
      console.log(`\n--- Reviewing agent ${i + 1}/${agents.length} ---`);
      displayAgentInfo(agent, i);
      
      const confirmDelete = await askConfirmation(
        `🗑️  Delete this agent: ${agentName}?`
      );
      
      if (!confirmDelete) {
        console.log(`⏭️  Skipped agent: ${agentName} (${agent.id})`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 Deleting agent ${i + 1}/${agents.length}: ${agentName}...`);
      
      const success = await deleteAgentSafely(agent.id, agentName);
      if (success) {
        deletedCount++;
      } else {
        failedCount++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 Deletion Summary:");
    console.log(`✅ Successfully deleted: ${deletedCount} agent(s)`);
    console.log(`⏭️  Skipped by user: ${skippedCount} agent(s)`);
    console.log(`❌ Failed to delete: ${failedCount} agent(s)`);
    console.log(`📊 Total processed: ${agents.length} agent(s)`);
    
    if (deletedCount > 0) {
      console.log("🎉 Agent deletion process completed successfully!");
    } else if (skippedCount === agents.length) {
      console.log("ℹ️  No agents were deleted (all skipped by user).");
    }

  } catch (error: any) {
    console.error("❌ Error connecting to Azure AI Foundry or listing agents:", error.message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Check your AZURE_AI_PROJECT_ENDPOINT_STRING environment variable");
    console.log("2. Verify your Azure credentials are properly configured");
    console.log("3. Ensure you have proper permissions to access the AI Project");
    console.log("4. Check that your Azure AI Foundry project is active and accessible");
  } finally {
    rl.close();
  }
}
//#endregion

//#region Error Handling
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Operation cancelled by user (Ctrl+C)');
  rl.close();
  process.exit(0);
});

// Run the main function
main().catch((err) => {
  console.error("💥 Unexpected error occurred:", err);
  rl.close();
  process.exit(1);
});
//#endregion