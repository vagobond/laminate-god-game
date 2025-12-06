import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, destinations, currentStep, choiceMade, previousDescription, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (action === "start") {
      const step = await generateStep(LOVABLE_API_KEY, destinations, 1, null, null, []);
      return new Response(JSON.stringify({ step }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "continue") {
      const nextStepNum = currentStep + 1;

      // Check if we've reached the end (20 steps)
      if (nextStepNum > 20) {
        return new Response(JSON.stringify({ complete: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const step = await generateStep(
        LOVABLE_API_KEY,
        destinations,
        nextStepNum,
        previousDescription,
        choiceMade,
        history || []
      );

      return new Response(JSON.stringify({ step }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Dream trip error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateStep(
  apiKey: string,
  destinations: string[],
  stepNumber: number,
  previousDescription: string | null,
  choiceMade: string | null,
  history: string[]
): Promise<{ step: number; description: string; choices: string[] }> {
  const destinationList = destinations.join(", ");
  const progressPercent = Math.round((stepNumber / 20) * 100);

  let contextPrompt = "";
  if (previousDescription && choiceMade) {
    contextPrompt = `
Previous scene: ${previousDescription}
The traveler chose: ${choiceMade}
Journey so far: ${history.join(" → ")}
`;
  }

  const systemPrompt = `You are a creative travel adventure storyteller. You're creating a "Choose Your Own Adventure" style story for a fantasy trip.

The traveler is visiting these destinations: ${destinationList}

Story progress: Step ${stepNumber} of 20 (${progressPercent}% complete)

Guidelines:
- Create vivid, immersive scenes that capture the magic of travel
- Include sensory details: sights, sounds, smells, tastes
- Reference local culture, food, landmarks, and hidden gems
- Build narrative tension and excitement
- Make each destination feel unique and memorable
- As the story progresses, weave in meaningful travel themes: personal growth, unexpected connections, wonder
- Near the end (steps 17-20), start wrapping up the journey with satisfying conclusions`;

  const userPrompt = `${contextPrompt}

Generate step ${stepNumber} of this dream trip adventure.

Respond ONLY with valid JSON in this exact format:
{
  "step": ${stepNumber},
  "description": "A 2-3 paragraph description of the current scene and situation (about 100-150 words)",
  "choices": ["First choice option", "Second choice option", "Third choice option"]
}

The description should set the scene and present a situation. The three choices should be distinct options that lead to different experiences.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limits exceeded, please try again later.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please try again later.");
    }
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error("Failed to generate adventure step");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in AI response");
  }

  // Parse JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse step from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    step: stepNumber,
    description: parsed.description,
    choices: parsed.choices.slice(0, 3), // Ensure exactly 3 choices
  };
}
