# Azure AI Agents Demo - AI Coding Agent Instructions

## 🏗️ Architecture Overview

This repo demonstrates Azure AI Agent Service integration using **two distinct Azure SDKs**:
- **`@azure/ai-projects`** (v1.0.0): Primary SDK for basic agent operations, threads, messages, runs
- **`@azure/ai-agents`** (v1.1.0): Advanced SDK for code interpreter, file attachments, tool utilities

### Dual SDK Pattern
Example 8 (`examples/8-codeInterpreter.ts`) demonstrates the hybrid approach:
```typescript
import { AIProjectClient } from "@azure/ai-projects";        // Basic client
import { AgentsClient, ToolUtility } from "@azure/ai-agents"; // Advanced tools
```

## 🔧 Development Patterns

### Client Initialization
**Standard pattern** (examples 1-7, 9):
```typescript
const client = new AIProjectClient(
  process.env["AZURE_AI_PROJECT_ENDPOINT_STRING"] || "<project endpoint>",
  new DefaultAzureCredential()
);
```

**MCP Server pattern** (azure-agent-mcp/):
```typescript
const client = AIProjectsClient.fromConnectionString(
  process.env.PROJECT_CONNECTION_STRING,
  new DefaultAzureCredential()
);
```

### Environment Variables
- Main examples use: `AZURE_AI_PROJECT_ENDPOINT_STRING`
- MCP server uses: `PROJECT_CONNECTION_STRING`
- Copy `.env.template` to `.env` for local development

### Agent Lifecycle Pattern
All examples follow: **Create → Use → Delete**
```typescript
const agent = await client.agents.createAgent("gpt-4o-mini", config);
// ... use agent
await client.agents.deleteAgent(agent.id);
```

## 🚀 Key Workflows

### Running Examples
- `npm run 1-9`: Individual numbered examples
- `tsx ./examples/X-*.ts`: Direct execution pattern
- Each example is self-contained and includes cleanup

### TypeScript Configuration
- ES Modules (`"type": "module"`)
- NodeNext module resolution
- Strict mode enabled
- Uses `tsx` for direct TypeScript execution

### Error Handling Conventions
- Always include fallback patterns (see example 7 for agent not found)
- Use type assertions for content access: `(content as any).text?.value`
- Polling pattern for run status with timeout handling

## 🔌 Integration Patterns

### File Operations
- **File uploads**: Stream-based using `fs.createReadStream()`
- **Vector stores**: Created automatically for file search capabilities
- **Code interpreter**: Requires `AgentsClient` and `ToolUtility.createCodeInterpreterTool()`

### Message Content Access
```typescript
// Safe content extraction pattern
const textContent = message.content[0]?.type === "text" 
  ? (message.content[0] as any).text?.value 
  : "No text content";
```

### Polling vs Streaming
- **No true streaming**: Current SDK doesn't support real-time streaming events
- **Polling pattern**: Check run status every 1000ms until completion
- **Simulate streaming**: Character-by-character display for UX (example 4)

## 📁 File Structure Conventions

- `examples/`: Numbered educational examples (1-9)
- `azure-agent-mcp/`: Model Context Protocol server implementation
- `files/`: Sample data files (CSV, PDF) for agent processing
- Each example includes detailed JSDoc headers explaining purpose

## 🎯 Agent Tool Patterns

### Code Interpreter (Example 8)
```typescript
const codeInterpreterTool = ToolUtility.createCodeInterpreterTool();
// Requires AgentsClient, not AIProjectClient
```

### File Search (Example 6)
```typescript
const fileSearchTool = {
  type: "file_search",
  file_search: { vector_store_ids: [vectorStore.id] }
};
```

### Interactive Deletion (Example 9)
- Uses readline for user confirmation
- Displays agent info before deletion
- Batch processing with individual confirmations

## 🔍 Debugging Tips

- **Authentication**: Always check `az login` status first
- **Environment**: Verify endpoint format and connection strings
- **SDK Version**: Check which SDK methods are available for your use case
- **Polling timeout**: Adjust delays based on model complexity
- **File processing**: Allow buffer time for vector store processing

## 🚫 Common Pitfalls

- Don't mix SDK client types in the same operation
- Don't assume streaming events exist (use polling)
- Don't forget to handle async iterator patterns for listing operations
- Always include type assertions for message content access
- Remember to clean up agents in examples to avoid resource accumulation