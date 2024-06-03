import { NextRequest } from "next/server";
import OpenAI from "openai";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assistantId = searchParams.get("assistantId");
  const fileId = searchParams.get("fileId");

  console.log("fileId: ", fileId)

  if (!assistantId)
    return Response.json(
      { error: "No assistant id provided" },
      { status: 400 }
    );
  if (!fileId)
    return Response.json({ error: "No file id provided" }, { status: 400 });

  const openai = new OpenAI();

  try {
    // Step 1: Add the file to the vector store
    const myVectorStoreFile = await openai.beta.vectorStores.files.create(
      "vs_pURmAxXe5Q9kVfWpPVVjo0cp",
      {
        file_id: fileId
      }
    );

    console.log(myVectorStoreFile);

    // Step 2: Update the assistant to use the new vector store
    const updatedAssistant = openai.beta.assistants.update(assistantId, {
      tool_resources: { file_search: { vector_store_ids: ["vs_pURmAxXe5Q9kVfWpPVVjo0cp"] } },
    });

    console.log(updatedAssistant);    

    return Response.json({ assistantFile: updatedAssistant });
  } catch (e) {
    console.log(e);
    return Response.json({ error: e });
  }
}
