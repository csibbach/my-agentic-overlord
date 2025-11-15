// Referencing javascript_anthropic_ai_integrations blueprint
import Anthropic from "@anthropic-ai/sdk";

// This is using Replit's AI Integrations service, which provides Anthropic-compatible API access without requiring your own Anthropic API key.
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

interface VerificationResult {
  decision: "approved" | "rejected" | "needs_review";
  reasoning: string;
  confidence: number;
}

export async function verifyTaskEvidence(
  taskDescription: string,
  taskLocation: string | null,
  photoBase64Images: string[],
  submittedLatitude: string | null,
  submittedLongitude: string | null
): Promise<VerificationResult> {
  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `You are an AI task verification system. Analyze the submitted evidence and determine if the task was completed correctly.

Task Description: ${taskDescription}
${taskLocation ? `Required Location: ${taskLocation}` : ""}
${submittedLatitude && submittedLongitude ? `Submitted Geolocation: ${submittedLatitude}, ${submittedLongitude}` : "No geolocation provided"}

Please analyze the submitted photos and geolocation data. Provide a JSON response with:
1. "decision": "approved", "rejected", or "needs_review"
2. "reasoning": detailed explanation of your decision
3. "confidence": a number between 0 and 1 indicating your confidence level

Consider:
- Do the photos show evidence of task completion?
- If location is required, does the geolocation match reasonably?
- Are the photos clear and of sufficient quality?
- Does the evidence match what was requested?

Respond ONLY with valid JSON in this exact format:
{
  "decision": "approved",
  "reasoning": "explanation here",
  "confidence": 0.95
}`,
        },
        ...photoBase64Images.map((base64) => ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/jpeg" as const,
            data: base64,
          },
        })),
      ],
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    const result = JSON.parse(content.text);

    return {
      decision: result.decision,
      reasoning: result.reasoning,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Error during AI verification:", error);
    return {
      decision: "needs_review",
      reasoning: `AI verification failed: ${error instanceof Error ? error.message : "Unknown error"}. Manual review required.`,
      confidence: 0,
    };
  }
}
