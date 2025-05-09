import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import type { MessageRole, MessageContentOutput } from "@azure/ai-projects";

dotenv.config();

const PROJECT_CONNECTION_STRING = process.env.PROJECT_CONNECTION_STRING;
const DEFAULT_AGENT_ID = process.env.DEFAULT_AGENT_ID || "";

let aiClient: AIProjectsClient | null = null;

function isTextContent(
  content: MessageContentOutput
): content is MessageContentOutput & { type: "text"; text: { value: string } } {
  return content.type === "text" && !!(content as any).text?.value;
}

/**
 * Initialize the Azure AI Agent client
 */
function initializeServer(): boolean {
  console.error("Initializing Azure AI Agent MCP server...");
  if (!PROJECT_CONNECTION_STRING) {
    console.error(
      "ERROR: Missing required environment variable: PROJECT_CONNECTION_STRING"
    );
    return false;
  }

  try {
    const credential = new DefaultAzureCredential();
    aiClient = AIProjectsClient.fromConnectionString(
      PROJECT_CONNECTION_STRING,
      credential
    );
    console.log("Azure AI Agent MCP server initialized successfully");
    return true;
  } catch (error) {
    console.error(
      `ERROR: Failed to initialize AIProjectClient: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}

function checkServerInitialized() {
  if (!serverInitialized) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: Azure AI Agent server is not initialized. Check server logs for details.",
        },
      ],
    };
  }
  return null;
}

/**
 * Query an Azure AI Agent and get the response
 */
async function queryAgent(
  agentId: string,
  userQuery: string,
  existingThreadId?: string
): Promise<{ response: string; threadId: string }> {
  if (!aiClient) {
    throw new Error("AI client not initialized");
  }

  try {
    // Verify agent exists and is accessible
    await aiClient.agents.getAgent(agentId);

    // Create a new thread or use existing one
    let threadId = existingThreadId;
    if (!threadId) {
      const thread = await aiClient.agents.createThread();
      threadId = thread.id;
    }

    // Add message to thread
    await aiClient.agents.createMessage(threadId, {
      role: "user" as MessageRole,
      content: userQuery,
    });

    // Create and process the run
    let run = await aiClient.agents.createRun(threadId, agentId);

    // Poll until the run is complete
    while (["queued", "in_progress", "requires_action"].includes(run.status)) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Non-blocking sleep
      run = await aiClient.agents.getRun(threadId, run.id);
    }

    if (run.status === "failed") {
      return {
        response: `Error: Agent run failed: ${
          run.lastError?.message || "Unknown error"
        }`,
        threadId,
      };
    }

    // Get the agent's response
    const messages = await aiClient.agents.listMessages(threadId);
    const assistantMessages = messages.data.filter(
      (m) => m.role === "assistant"
    );
    const lastMessage = assistantMessages[assistantMessages.length - 1];

    let responseText = "";
    if (lastMessage) {
      for (const content of lastMessage.content) {
        if (isTextContent(content)) {
          responseText += content.text.value + "\n";
        }
      }
    }

    return { response: responseText.trim(), threadId };
  } catch (error) {
    throw new Error(
      `Agent query failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Initialize server
const serverInitialized = initializeServer();

// Create MCP server
const mcp = new McpServer({
  name: "azure-agent",
  version: "1.0.0",
  description: "MCP server for Azure AI Agent Service integration",
});

// Register tools
mcp.tool(
  "query_agent",
  "Query a specific Azure AI Agent",
  {
    agent_id: z.string().describe("The ID of the Azure AI Agent to query"),
    query: z.string().describe("The question or request to send to the agent"),
    thread_id: z
      .string()
      .optional()
      .describe("Thread ID for conversation continuation"),
  },
  async ({ agent_id, query, thread_id }) => {
    const errorResponse = checkServerInitialized();
    if (errorResponse) return errorResponse;

    try {
      const { response, threadId } = await queryAgent(
        agent_id,
        query,
        thread_id
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `## Response from Azure AI Agent\n\n${response}\n\n(thread_id: ${threadId})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error querying agent: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

mcp.tool(
  "query_default_agent",
  "Query the default Azure AI Agent",
  {
    query: z.string().describe("The question or request to send to the agent"),
    thread_id: z
      .string()
      .optional()
      .describe("Thread ID for conversation continuation"),
  },
  async ({ query, thread_id }) => {
    const errorResponse = checkServerInitialized();
    if (errorResponse) return errorResponse;

    if (!DEFAULT_AGENT_ID) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: No default agent configured. Set DEFAULT_AGENT_ID environment variable or use query_agent tool.",
          },
        ],
      };
    }

    try {
      const { response, threadId } = await queryAgent(
        DEFAULT_AGENT_ID,
        query,
        thread_id
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `## Response from Default Azure AI Agent\n\n${response}\n\n(thread_id: ${threadId})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error querying default agent: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

mcp.tool("list_agents", "List all available Azure AI Agents", {}, async () => {
  const errorResponse = checkServerInitialized();
  if (errorResponse) return errorResponse;

  try {
    const agents = await aiClient!.agents.listAgents();
    if (!agents.data || agents.data.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No agents found in the Azure AI Agent Service.",
          },
        ],
      };
    }

    let result = "## Available Azure AI Agents\n\n";
    for (const agent of agents.data) {
      result += `- **${agent.name}** (ID: \`${agent.id}\`)\n`;
    }

    if (DEFAULT_AGENT_ID) {
      result += `\n**Default Agent ID**: \`${DEFAULT_AGENT_ID}\``;
    }

    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error listing agents: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
});

async function main() {
  console.error("\n==================================================");
  console.error(
    `Azure AI Agent MCP Server ${
      serverInitialized ? "successfully initialized" : "initialization failed"
    }`
  );
  console.error("Starting server...");
  console.error("==================================================\n");

  const transport = new StdioServerTransport();
  await mcp.connect(transport);
}

main().catch((error) => {
  console.error(
    `FATAL: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});