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

2. With the install dependencies, also install openai dependencies: 
```bash
npm install openai
# or
yarn add openai
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```bash
OPENAI_API_KEY=your-openai-api-key
```

4. Run the development server:
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

### Step 2: Upload Files you would like to add for file_search

Use the form to upload your files for file_search

```javascript
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file]
      // In this example, I only upload the first
      const file = fileArray[0];

      // Create a ReadStream from the file
      const newPath = `${file.filepath.substring(0, file.filepath.lastIndexOf('\\') + 1)}${file.originalFilename}`;
      await renameAsync(file.filepath, newPath);
      const fileStream = createReadStream(newPath);      

      const openai = new OpenAI();
      // Create a vector store including our two files.
      let vectorStore = await openai.beta.vectorStores.create({
      name: "Financial Statement",
      });
    
      const response = await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, fileStreams);

      res.status(200).json({ file: response });
    } catch (e) {
      res
        .status(500)
        .json({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  });
}
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
-   **`app/api/assistant`**: API routes for creating, deleting, listing and modifying an ai-assistant.
-   **`pages/api/file/upload.ts`**: API routes for uploading files for an ai-assistant.
-   **`app/api/assistant-file`**: API routes for creating, deleting and listing files for an ai-assistant.
-   **`app/api/thread`**: API routes for creating and deleting message threads for an ai-assistant.
-   **`app/api/run`**: API routes for canceling, creating and retriving messages for an ai-assistant thread.
-   **`app/api/message`**: API routes for creating and listing messages for an ai-assistant thread.
-   **`app/components`**: Frontend components for the ai-assistant create, upload messgae and fun features. 

## Learn More

To learn more about Next.js and OpenAI, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs)
-   [OpenAI API Documentation](https://platform.openai.com/docs/assistants/tools/file-search/)
-  [OpenAI API Reference](https://platform.openai.com/docs/api-reference/assistants/createAssistant/)