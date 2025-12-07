import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('User not authenticated');
    }

    const { action, destinations, currentStep, choiceMade, previousDescription, history, currentDestinationIndex } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate total steps: 2 steps per destination, minimum 10 steps
    const totalSteps = Math.max(destinations.length * 2, 10);

    if (action === "start") {
      const step = await generateStep(LOVABLE_API_KEY, destinations, 1, null, null, [], 0, totalSteps);
      return new Response(JSON.stringify({ step, totalSteps, currentDestinationIndex: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "continue") {
      const nextStepNum = currentStep + 1;
      
      // Calculate which destination we should be at based on progress
      const stepsPerDestination = totalSteps / destinations.length;
      const newDestinationIndex = Math.min(
        Math.floor((nextStepNum - 1) / stepsPerDestination),
        destinations.length - 1
      );

      // Check if we've reached the end
      if (nextStepNum > totalSteps) {
        return new Response(JSON.stringify({ complete: true, currentDestinationIndex: destinations.length - 1 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const step = await generateStep(
        LOVABLE_API_KEY,
        destinations,
        nextStepNum,
        previousDescription,
        choiceMade,
        history || [],
        newDestinationIndex,
        totalSteps
      );

      return new Response(JSON.stringify({ step, totalSteps, currentDestinationIndex: newDestinationIndex }), {
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
  history: string[],
  currentDestinationIndex: number,
  totalSteps: number
): Promise<{ step: number; description: string; choices: string[] }> {
  const currentDestination = destinations[currentDestinationIndex];
  const destinationList = destinations.join(" → ");
  const progressPercent = Math.round((stepNumber / totalSteps) * 100);
  const stepsPerDestination = totalSteps / destinations.length;
  const isTransitionStep = stepNumber % stepsPerDestination === 0 && currentDestinationIndex < destinations.length - 1;
  const nextDestination = destinations[currentDestinationIndex + 1];

  let contextPrompt = "";
  if (previousDescription && choiceMade) {
    contextPrompt = `
Previous scene: ${previousDescription}
The traveler chose: ${choiceMade}
Journey so far: ${history.join(" → ")}
`;
  }

  const systemPrompt = `You are a creative travel adventure storyteller. You're creating a "Choose Your Own Adventure" style story for a fantasy trip.

The complete journey: ${destinationList}
CURRENT LOCATION: ${currentDestination} (destination ${currentDestinationIndex + 1} of ${destinations.length})
${isTransitionStep ? `IMPORTANT: This step should END in ${currentDestination} and set up the transition to the NEXT destination: ${nextDestination}` : ""}

Story progress: Step ${stepNumber} of ${totalSteps} (${progressPercent}% complete)

Guidelines:
- Create vivid, immersive scenes set specifically in ${currentDestination}
- Include sensory details: sights, sounds, smells, tastes specific to ${currentDestination}
- Reference local culture, food, landmarks, and hidden gems of ${currentDestination}
- Build narrative tension and excitement
- Make ${currentDestination} feel unique and memorable
${isTransitionStep ? `- This is a TRANSITION step: wrap up the ${currentDestination} experience and have one choice lead to departing for ${nextDestination}` : ""}
${stepNumber >= totalSteps - 2 ? "- We're nearing the end: start wrapping up the journey with satisfying conclusions" : ""}`;

  const userPrompt = `${contextPrompt}

Generate step ${stepNumber} of this dream trip adventure, set in ${currentDestination}.

Respond ONLY with valid JSON in this exact format:
{
  "step": ${stepNumber},
  "description": "A 2-3 paragraph description of the current scene in ${currentDestination} (about 100-150 words)",
  "choices": ["First choice option", "Second choice option", "Third choice option"]
}

The description should set the scene in ${currentDestination} and present a situation. The three choices should be distinct options that lead to different experiences.`;

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
    choices: parsed.choices.slice(0, 3),
  };
}
