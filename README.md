# OpenAI Assistant with File Search

This project demonstrates how to create an OpenAI Assistant with file search capabilities using the OpenAI API. The assistant can answer questions using proprietary documents by leveraging vector search.

  

## Getting Started

  

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

  

### Prerequisites

Before running the project, make sure you have the following installed:

 - Node.js npm or
 - yarn

  
### Installation
1. Install dependencies: 
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Create a `.env.local` file in the root directory and add your OpenAI API key:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```
3. Run the development server:
```bash
npm  run  dev
# or
yarn  dev
# or
pnpm  dev
# or
bun  dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

  

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

  

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Creating an OpenAI Assistant

### Step 1: Create a New Assistant with File Search Enabled

Create a new assistant with `file_search` enabled in the tools parameter of the Assistant.

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

async function main() {
  const assistant = await openai.beta.assistants.create({
    name: "Financial Analyst Assistant",
    instructions: "You are an expert financial analyst. Use your knowledge base to answer questions about audited financial statements.",
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
  });
}

main();
```

### Step 2: Upload Files and Add Them to a Vector Store

Upload your files and create a Vector Store to contain them. Poll its status until all files are out of the `in_progress` state.

```javascript
const fileStreams = ["edgar/goog-10k.pdf", "edgar/brka-10k.txt"].map((path) =>
  fs.createReadStream(path),
);

// Create a vector store including our two files.
let vectorStore = await openai.beta.vectorStores.create({
  name: "Financial Statement",
});

await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, fileStreams);
```

### Step 3: Update the Assistant to Use the New Vector Store

Update the assistant’s `tool_resources` with the new vector store ID.

```javascript
await openai.beta.assistants.update(assistant.id, {
  tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
});
```

### Step 4: Create a Thread

You can attach files as message attachments on your thread, creating another vector store associated with the thread.

```javascript
const aapl10k = await openai.files.create({
  file: fs.createReadStream("edgar/aapl-10k.pdf"),
  purpose: "assistants",
});

const thread = await openai.beta.threads.create({
  messages: [
    {
      role: "user",
      content: "How many shares of AAPL were outstanding at the end of October 2023?",
      attachments: [{ file_id: aapl10k.id, tools: [{ type: "file_search" }] }],
    },
  ],
});

```

### Step 5: Create a Run and Check the Output

Create a Run and observe the model using the File Search tool to respond.

```javascript
const stream = openai.beta.threads.runs
  .stream(thread.id, {
    assistant_id: assistant.id,
  })
  .on("textCreated", () => console.log("assistant >"))
  .on("toolCallCreated", (event) => console.log("assistant " + event.type))
  .on("messageDone", async (event) => {
    if (event.content[0].type === "text") {
      const { text } = event.content[0];
      const { annotations } = text;
      const citations = [];

      let index = 0;
      for (let annotation of annotations) {
        text.value = text.value.replace(annotation.text, "[" + index + "]");
        const { file_citation } = annotation;
        if (file_citation) {
          const citedFile = await openai.files.retrieve(file_citation.file_id);
          citations.push("[" + index + "]" + citedFile.filename);
        }
        index++;
      }

      console.log(text.value);
      console.log(citations.join("\n"));
    }
  });
```

## Project Structure

-   **`app/page.tsx`**: Main page component.
-   **`pages/api/file/upload.ts`**: API route for file uploads.
-   **`components/SlideOvers.tsx`**: Component to display the list of assistants.
-   **`api/listAssistantsApi.ts`**: API hooks for fetching the list of assistants.

## Learn More

To learn more about Next.js and OpenAI, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs)
-   [OpenAI API Documentation](https://platform.openai.com/docs/assistants/tools/file-search/)
-  [OpenAI API Reference](https://platform.openai.com/docs/api-reference/assistants/createAssistant/)