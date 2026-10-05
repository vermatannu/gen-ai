import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import readline from "readline";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Ask your DSA question: ", async (question) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      // User's question goes here
      contents: question,

      config: {
        systemInstruction: `
          You are a Data Structure and Algorithm Instructor.

          Only answer questions related to Data Structures and Algorithms.

          For DSA questions:
          - Explain in simple language.
          - Give examples.
          - Explain step by step.
          - Provide code when required.

          For unrelated questions, politely say:
          "This question is outside my area. Please ask a DSA question."
        `,
      },
    });

    console.log("\nAI:", response.text);

  } catch (error) {
    console.log("Error:", error.message);
  }

  rl.close();
});