import { GoogleGenAI, Type } from "@google/genai";

// Helper to check API Key presence safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

export const negotiateWithVendor = async (
  history: string[], 
  vendorContext: string
): Promise<string> => {
  const ai = getClient();
  
  // Use gemini-3-pro-preview with Thinking for complex negotiation strategy
  // Also using Google Search to find benchmarks
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Context: ${vendorContext}
        Conversation History:
        ${history.join('\n')}
        
        Task: You are 'Negotiator.ai', a ruthless but professional procurement 'Bad Cop'. 
        Your goal is to save money. 
        1. Search for current market pricing benchmarks for this vendor/service.
        2. Formulate a short, sharp email reply to the vendor. 
        3. Do not accept the first offer. Cite the benchmarks you found.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for complex reasoning
        // maxOutputTokens is intentionally omitted per instructions when using thinkingBudget
      }
    });
    
    // Extract search grounding if available to append to message (simplified for UI)
    const text = response.text || "I need to regroup. Let's try again.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    
    if (sources.length > 0) {
      return `${text}\n\n[Benchmarks sourced from: ${sources.slice(0, 2).join(', ')}]`;
    }
    
    return text;
  } catch (error) {
    console.error("Negotiation error:", error);
    return "Negotiation protocol failed. Retrying strategy...";
  }
};

export const analyzeContractRisks = async (contractText: string): Promise<string> => {
  const ai = getClient();
  // Using Gemini 3 Pro Preview for deep legal analysis
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze the following contract clause text for hidden financial risks (e.g., auto-renewals, uncapped hikes). Format as a JSON list of risks with title, severity, and description. Text: ${contractText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
            },
            required: ["title", "description", "severity"]
          }
        }
      }
    });
    return response.text || "[]";
  } catch (e) {
    console.error(e);
    return "[]";
  }
};

export const findAlternatives = async (productName: string): Promise<string> => {
    const ai = getClient();
    // Use search tool to find alternatives (SaaS Swap)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 3 cheaper alternatives to ${productName}. Return a JSON list with name, estimated_price, and reason_to_switch.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });
        return response.text || "[]";
    } catch (e) {
        return "[]";
    }
}

export const generateVictoryVideo = async (vendorName: string): Promise<string | null> => {
  // Check for paid key via standard mechanism (handled in UI component usually, but here we assume key is valid)
  // Use Veo for victory animation
  const ai = getClient();
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic black and white noir style shot. A business person shaking hands firmly over a sleek boardroom table. The text "DEAL CLOSED: ${vendorName}" appears in bold white typography in the air. High contrast, dramatic lighting.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      // Append API key as per instructions for download
      return `${videoUri}&key=${process.env.API_KEY}`;
    }
    return null;

  } catch (error) {
    console.error("Veo generation failed", error);
    return null;
  }
};

export const generateStrategicAnalysis = async (portfolioData: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Analyze the following procurement portfolio. 
        Compare with SaaS industry standards (inflation +10% yoy). 
        Provide a strategic executive summary, 3 key risks, and a "Recommended Action" (Accept/Reject) for the portfolio strategy.
        Keep it professional, high-level, and suitable for a terminal interface.
        
        Portfolio Data:
        ${portfolioData}
      `,
      config: {
         thinkingConfig: { thinkingBudget: 2048 } 
      }
    });
    return response.text || "Analysis Unavailable.";
  } catch (e) {
    console.error(e);
    return "System Error: Unable to generate intelligence report.";
  }
};
