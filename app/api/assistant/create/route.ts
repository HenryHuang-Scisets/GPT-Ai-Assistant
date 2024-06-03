import OpenAI from "openai";

export async function GET() {
  const openai = new OpenAI();

  try {
    const assistant = await openai.beta.assistants.create({
      name: "Scisets Demo",
      instructions: "You are a professional stock analyst. I will ask you questions about the stock market and you will answer them. You can use the documents I provide to you to help you answer the questions.",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    console.log(assistant);

    return Response.json({ assistant: assistant });
  } catch (e) {
    console.log(e);
    return Response.json({ error: e });
  }
}
