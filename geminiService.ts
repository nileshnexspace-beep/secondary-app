
import { GoogleGenAI } from "@google/genai";
import { InventoryLog } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getPortfolioInsights(logs: InventoryLog[]) {
  const dataSummary = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.count;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    As a real estate data analyst, provide a concise 3-sentence summary of the following inventory data.
    Identify the most active category and suggest where the team should focus their efforts based on the volume.
    
    Current Inventory Data:
    ${JSON.stringify(dataSummary)}
    
    Total Log Entries: ${logs.length}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this time. Please check your data or connection.";
  }
}
