# Azure AI Agent Service Demo

This demo originally started out using the code from the [Azure AI Agent QuickStart](https://learn.microsoft.com/azure/ai-services/agents/quickstart), 

## Prerequisites

To use the demo you'll need to complete the steps in the [QuickStart](https://learn.microsoft.com/azure/ai-services/agents/quickstart?pivots=programming-language-javascript) to set up your Azure AI Foundry project. If you'd like to use the AI Search/RAG functionality in the demo, you'll find details about the setup in the [AI Search tooling](https://learn.microsoft.com/azure/ai-services/agents/how-to/tools/azure-ai-search?tabs=azurecli%2Cjavascript&pivots=code-examples) document.

## Running the Demo

After going through the QuickStart steps (and optionally the AI Search and Bing Grounding tooling setup), perform the following steps:

1. Rename `.env.template` to `.env`:

   ```bash
   cp .env.template .env
   ```

2. Set up your environment variables in the `.env` file:
   
   - `AI_FOUNDRY_PROJECT_CONNECTION_STRING`: Your Azure AI Foundry connection string
   - `AI_MODEL`: (Optional) The model deployment name (e.g. "gpt-4o-mini")
   - `AI_AGENT_ID`: (Optional) Your pre-existing agent ID (only needed for example 7)
   - `BING_GROUNDING_CONNECTION_ID`: (Optional) For Bing grounding functionality
   - `AI_SEARCH_CONNECTION_ID`: (Optional) For AI Search/RAG functionality

3. Install the project dependencies:

    ```bash
    npm install
    ```

4. Start the main demo application:
    ```bash
    npm start
    ```

5. Or run any of the example scripts:
    ```bash
    # Run a specific example
    npm run basic      # Example 1
    npm run threads    # Example 2
    npm run messages   # Example 3
    npm run streaming  # Example 4
    npm run run        # Example 5
    npm run agent-attachment  # Example 6
    npm run call-existing     # Example 7
    ```

## Example Files - A Not-So-Serious Guide

The examples directory contains various demonstrations of the Azure AI Agent Service capabilities:

### `1-basic.ts`
*The "Hello World" of AI agents that creates and destroys an agent faster than you can say "artificial intelligence." It's like having a child and sending them off to college in the same day.*

### `2-threads.ts` 
*Creates a conversational thread, says "hi", then immediately ghosts it. The digital equivalent of making eye contact on the street and then pretending it never happened.*

### `3-messages.ts`
*The gossipy one that creates messages in a thread and then can't help but read them back. It's like texting yourself and then being surprised by your own message.*

### `4-streaming.ts`
*Demonstrates streaming capabilities with all the patience of a caffeinated squirrel. Watch as it interrupts the AI mid-sentence because it just can't wait to show you each word!*

### `5-run.ts`
*The micromanager that creates a run and then obsessively checks its status every second. "Are you done yet? How about now? Now?"*

### `6-agentAttachment.ts`
*Uploads a file and then creates an agent that can search it, like that friend who insists on showing you their vacation photos and then narrates each one in excruciating detail.*

### `7-callExisting.ts`
*Uses an existing agent instead of creating a new one. The ultimate lazy script that makes others do all the hard work while it takes all the credit.*

### `8-codeInterpreter.ts`
*Uploads data and unleashes an agent with code interpreter powers that's part data scientist, part comedian. It's like giving a calculator to a stand-up comedian who insists on turning your serious financial data into bar charts with punchlines.*



## Dataset

https://catalog.data.gov/dataset/texas-state-expenditures-by-county-2023/resource/ca2c36f3-107f-4f28-af82-974de9193b36

https://learn.microsoft.com/en-us/azure/ai-services/openai/overview
