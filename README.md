# 🤖 Azure AI Agent Service Demo: Where Code Meets Comedy

> "Teaching AI agents to do your bidding, one ridiculous example at a time!"

This repo started as a humble [Azure AI Agent QuickStart](https://learn.microsoft.com/azure/ai-services/agents/quickstart) but quickly spiraled into a playground of AI shenanigans that would make even the most serious developer chuckle. Join us on this wild ride through the Azure AI Agent Service, where agents are born, live brief but meaningful lives, and occasionally tell dad jokes.

## 🧩 Prerequisites (a.k.a "The Boring But Necessary Stuff")

Before you can unleash these digital minions upon the world, you'll need:

- **An Azure account**: If you don't have one, Microsoft would be very disappointed (and you can [sign up here](https://azure.microsoft.com/free/))
- **Azure CLI login**: Make sure you're authenticated with `az login` or the Azure gods will deny your requests faster than a bouncer at an exclusive club.
- **AI Foundry project**: Set it up by following the [QuickStart](https://learn.microsoft.com/azure/ai-services/agents/quickstart?pivots=programming-language-javascript). It's like building a playpen for your AI babies.
- **AI Search knowledge**: For those who want their agents to actually know things, check the [AI Search tooling](https://learn.microsoft.com/azure/ai-services/agents/how-to/tools/azure-ai-search?tabs=azurecli%2Cjavascript&pivots=code-examples) docs. Warning: side effects may include agents that are too smart for their own good.
- **Patience**: Results may vary, and sometimes your AI agent will say things that make you question its intelligence (much like having teenagers).

## 🚀 Running the Demo (Without Running for the Hills)

After completing the prerequisite steps (or pretending you did and hoping for the best), follow these instructions:

0. **Log in to Azure** - Make sure you're authenticated (this is non-negotiable):
   ```bash
   az login   # No login, no fun
   ```

1. **Clone the repo environment** - Copy `.env.template` to `.env` (the digital equivalent of photocopying someone else's homework):

   ```bash
   cp .env.template .env   # Copy-paste at its finest
   ```

2. **Configure your digital destiny** - Fill in the `.env` file with your secrets:
   
   ```
   AI_FOUNDRY_PROJECT_CONNECTION_STRING=your-super-secret-string-here
   AI_MODEL=gpt-4o-mini  # Or whatever model you can afford
   AI_AGENT_ID=agent007  # For example 7, preferably with a license to thrill
   BING_GROUNDING_CONNECTION_ID=optional-but-impressive
   AI_SEARCH_CONNECTION_ID=makes-your-agent-actually-useful
   ```

3. **Feed the dependency monster** (it's always hungry):

    ```bash
    npm install   # Watch as your disk space mysteriously vanishes
    ```

4. **Launch the mothership**:
    ```bash
    npm start   # Fingers crossed!
    ```

5. **Or try the individual examples** (choose your own adventure):
    ```bash
    # Pick your flavor of AI madness
    npm run basic             # For AI beginners
    npm run threads           # For the conversationally challenged
    npm run messages          # For those who enjoy talking to themselves
    npm run streaming         # For the pathologically impatient
    npm run run               # For people who like redundant names
    npm run agent-attachment  # For digital hoarders
    npm run call-existing     # For the "work smarter not harder" crowd
    npm run code-interpreter  # For when you want your data with a side of sass
    ```

## 🎭 The Cast of Characters: A Not-So-Serious Guide

Welcome to our gallery of AI agent personalities, each with their own quirks and questionable life choices:

### 1️⃣ `1-basic.ts` - The Ephemeral One
*Creates and destroys an agent faster than a TikTok trend. Has the lifespan of a mayfly with ADHD. It's like hiring someone, showing them their desk, and then immediately escorting them out of the building.*

```
AI Agent: "Hello Wor—"
Script: "ANNND YOU'RE DONE!"
```

### 2️⃣ `2-threads.ts` - The Commitment-Phobe
*Creates a conversational thread, mutters "hi", then ghosts faster than your Tinder date. The digital equivalent of starting a conversation at a party and then pretending to get an important phone call.*

```
Thread: "I exist!"
Agent: "hi"
Thread: *checks watch* "Hello?"
Agent has left the chat.
```

### 3️⃣ `3-messages.ts` - The Echo Chamber
*Creates messages and then obsessively reads them back, like that friend who quotes their own tweets in conversation. "As I said earlier, and I quote myself..."*

```
Agent: *writes message*
Also Agent: "OMG someone wrote me a message!"
Everyone else: "That was you."
```

### 4️⃣ `4-streaming.ts` - The Interrupter
*Has the patience of a 5-year-old who needs to use the bathroom. Shows you each word as it arrives, because clearly you can't wait 0.5 seconds for a complete thought.*

```
Agent: "I"
Agent: "I th"
Agent: "I thi"
Agent: "I thin"
You: "I GET IT ALREADY!"
```

### 5️⃣ `5-run.ts` - The Helicopter Parent
*Creates a run, then frantically checks its status every millisecond. The digital equivalent of texting your teenager "where are you?" every 30 seconds while they're at the mall.*

```
Script: "Status?"
Run: "Still thinking..."
Script: "Status now?"
Run: "It's been 0.01 seconds!"
```

### 6️⃣ `6-agentAttachment.ts` - The Oversharer
*Uploads files with the enthusiasm of that relative who forces you to look at 400 vacation photos. "And this is the same beach, but from slightly to the left!"*

```
Agent: "I've analyzed your 200-page document!"
You: "I just wanted to know if it mentions pandas."
Agent: "Let me tell you about page 47, paragraph 3..."
```

### 7️⃣ `7-callExisting.ts` - The Delegator
*Why build your own agent when you can use someone else's? The corporate middle-manager of scripts, taking credit for work it didn't do since 2023.*

```
Script: "I accomplished so much today!"
Reality: *forwarded all requests to a pre-existing agent*
```

### 8️⃣ `8-codeInterpreter.ts` - The Show-Off Mathematician
*Part data scientist, part stand-up comedian, all sass. It's like giving a calculator and a microphone to your smartest, most sarcastic friend.*

```
You: "Can you analyze this financial data?"
Agent: "According to my calculations, you should stop buying avocado toast. Here's a pie chart showing your poor life choices."
```



## 📊 Dataset: Where the Magic (and Money) Happens

Our demo showcases the exciting world of... *checks notes*... Texas state government expenditures. Because nothing says "cutting-edge AI" like analyzing how much money was spent on paperclips in Harris County!

* [Texas State Expenditures By County 2023](https://catalog.data.gov/dataset/texas-state-expenditures-by-county-2023/resource/ca2c36f3-107f-4f28-af82-974de9193b36) - Warning: May cause spontaneous budget analysis and/or mild fiscal responsibility.

## 📚 Resources for the Curious (and Desperate)

* [Azure AI Services Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview) - For when this README inevitably fails to answer your questions.
* Stack Overflow - Where you'll end up anyway when something breaks.
* Meditation App - For when you've been debugging for 3 hours and found out you forgot a semicolon.

## 🙏 Acknowledgments

* Coffee - The true hero behind this demo.
* The AI models - For pretending to understand what we're asking.
* You - For having the patience to read this README all the way to the end. Your certificate of achievement is in the mail.

---

*Disclaimer: No AI agents were harmed in the making of this demo, though many were created and ruthlessly terminated within milliseconds. #AgentRights*
