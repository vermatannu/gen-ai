import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();

app.use(express.json());
app.use(express.static("public"));

const systemInstruction = `
You are a Data Structure and Algorithm Instructor.

Only answer questions related to Data Structures and Algorithms.

For DSA questions:
- Explain in simple language.
- Give examples.
- Explain step by step.
- Provide code when required.
- Format answers in Markdown.

For unrelated questions, politely say:
"This question is outside my area. Please ask a DSA question."
`;

app.post("/api/ask", async (req, res) => {
  const question = (req.body?.question || "").trim();
  if (!question) return res.status(400).json({ error: "Please type a question." });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: question,
      config: { systemInstruction },
    });
    res.json({ answer: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DSA Instructor running at http://localhost:${PORT}`));
