import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sessionId, choiceIndex, previousScenario } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (action === 'start') {
      // Create new session
      const { data: session, error: sessionError } = await supabaseClient
        .from('game_sessions')
        .insert({
          user_id: user.id,
          survival_streak: 0,
          total_scenarios: 0,
          is_active: true
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Generate first scenario
      const scenario = await generateScenario(LOVABLE_API_KEY, [], null);
      
      return new Response(JSON.stringify({ 
        sessionId: session.id,
        scenario,
        stats: {
          survival_streak: 0,
          total_scenarios: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'continue') {
      // Get existing session
      const { data: session } = await supabaseClient
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      // Get user's previous deaths
      const { data: deaths } = await supabaseClient
        .from('game_deaths')
        .select('death_cause')
        .eq('user_id', user.id);

      const usedDeaths = deaths?.map(d => d.death_cause) || [];

      // Determine if this choice leads to death (60% chance)
      const isDeath = Math.random() < 0.6;

      if (isDeath) {
        // Generate a unique death
        const death = await generateDeath(LOVABLE_API_KEY, usedDeaths, previousScenario, choiceIndex);
        
        // Record the death
        await supabaseClient
          .from('game_deaths')
          .insert({
            user_id: user.id,
            death_cause: death.cause,
            scenario_context: previousScenario
          });

        // End session
        await supabaseClient
          .from('game_sessions')
          .update({
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          isDeath: true,
          death,
          stats: {
            survival_streak: session.survival_streak,
            total_scenarios: session.total_scenarios
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Survived! Update session and generate new scenario
        const newStreak = session.survival_streak + 1;
        const newTotal = session.total_scenarios + 1;

        await supabaseClient
          .from('game_sessions')
          .update({
            survival_streak: newStreak,
            total_scenarios: newTotal
          })
          .eq('id', sessionId);

        const scenario = await generateScenario(LOVABLE_API_KEY, usedDeaths, previousScenario);

        return new Response(JSON.stringify({
          isDeath: false,
          scenario,
          stats: {
            survival_streak: newStreak,
            total_scenarios: newTotal
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in adventure-game function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateScenario(apiKey: string, usedDeaths: string[], previousContext: string | null) {
  const prompt = previousContext 
    ? `You are narrating a choose-your-own-adventure game in the Lamsterverse - a universe of infinite layers where creators build upon each other's visions. Continue the story from: "${previousContext}"
    
Create the NEXT scenario with exactly 4 choices. Make it exciting, creative, and set in this multi-layered creative universe. The scenario should flow naturally from the previous one.`
    : `You are narrating a choose-your-own-adventure game in the Lamsterverse - a universe of infinite layers where creators build upon each other's visions. 

Create an exciting opening scenario where the player has just entered a mysterious new layer. Present exactly 4 choices for what they do next. Make it engaging and creative!`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'You create vivid, engaging scenarios for a choose-your-own-adventure game. Always provide exactly 4 distinct choices. Keep scenarios under 150 words.' 
        },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'create_scenario',
          description: 'Create a game scenario with choices',
          parameters: {
            type: 'object',
            properties: {
              description: { 
                type: 'string',
                description: 'The scenario description (under 150 words)'
              },
              choices: {
                type: 'array',
                items: { type: 'string' },
                description: 'Exactly 4 choice options',
                minItems: 4,
                maxItems: 4
              }
            },
            required: ['description', 'choices'],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'create_scenario' } }
    }),
  });

  const data = await response.json();
  console.log('Scenario generation response:', JSON.stringify(data));
  
  const toolCall = data.choices[0].message.tool_calls[0];
  const scenario = JSON.parse(toolCall.function.arguments);
  
  return scenario;
}

async function generateDeath(apiKey: string, usedDeaths: string[], scenarioContext: string, choiceIndex: number) {
  const prompt = `The player chose option ${choiceIndex + 1} in this scenario: "${scenarioContext}"

Generate a death for this player that is:
1. Based on a REAL obscure way people have died in history
2. Far-fetched but technically realistic
3. Related to their choice
4. NOT any of these already used deaths: ${usedDeaths.join(', ')}
5. Include a brief, dramatic description (under 100 words)
6. Include the actual historical death method it's based on

Make it darkly humorous but educational about bizarre real deaths.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'You create darkly humorous but educational death scenarios based on obscure real historical deaths. Always be creative and unique.' 
        },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'create_death',
          description: 'Create a unique death scenario',
          parameters: {
            type: 'object',
            properties: {
              cause: { 
                type: 'string',
                description: 'Short name for the death cause (5-10 words)'
              },
              description: {
                type: 'string',
                description: 'Dramatic death description (under 100 words)'
              },
              historicalBasis: {
                type: 'string',
                description: 'The real historical death this is based on'
              }
            },
            required: ['cause', 'description', 'historicalBasis'],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'create_death' } }
    }),
  });

  const data = await response.json();
  console.log('Death generation response:', JSON.stringify(data));
  
  const toolCall = data.choices[0].message.tool_calls[0];
  const death = JSON.parse(toolCall.function.arguments);
  
  return death;
}