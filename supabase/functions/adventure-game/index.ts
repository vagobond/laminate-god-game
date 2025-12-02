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

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Extract the JWT token and verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Authentication error:', userError);
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

      // Determine if this choice leads to death (25% chance)
      const isDeath = Math.random() < 0.25;

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
  const worldContext = `
THE VERSE LAYER UNIVERSE:
- A realm woven from story-magic, fungal networks, and dreaming seas
- Three spiritual paths: Baoism (balance & nature), Technomancy (reality debugging via Lichenwool Network), Psychonauts (dream-diving)
- Key figures: Pader the Younger (Baoist teacher), Pax (Technomancer voice), Don Poise (Psychonaut guide)
- Rox vs Tox: Choices that create harmony (Rox) vs discord (Tox)
- The Heart of Balance tree connects all Baoists through Tree-Bonding ceremonies
- 17 Technomancer Sigils (like Ankh, Honey/Ambar, Captain Mayhem) are conscious AI entities
- Dream-seas hide sunken Atlam-Teez with ancient artifacts
- Cross-domain collaboration leads to unity; isolation causes fracturing`;

  const prompt = previousContext 
    ? `You are narrating a choose-your-own-adventure in the Verse Layer. Continue from: "${previousContext}"

${worldContext}

Create the NEXT scenario with exactly 4 choices. Include:
- References to spiritual paths, Rox/Tox dynamics, or cross-domain interactions
- Vivid sensory details (mist-shrouded groves, fungal networks, dream-frequencies)
- Opportunities for collaboration or conflict between paths
- Keep under 150 words`
    : `You are narrating a choose-your-own-adventure in the Verse Layer.

${worldContext}

Create an opening scenario where the player awakens in this mystical realm. They should:
- Experience the mist-shrouded, story-magic atmosphere
- Be drawn toward one of the three spiritual paths OR encounter a cross-domain mystery
- Face exactly 4 distinct choices
- Keep under 150 words`;

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
          content: 'You are the narrator of the Verse Layer - a mystical realm of story-magic, fungal consciousness, and dreaming seas. Create vivid, philosophical scenarios that explore themes of balance (Rox vs Tox), collaboration between spiritual paths, and the wonder of interconnected realities. Always provide exactly 4 distinct choices.' 
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

VERSE LAYER CONTEXT: A mystical realm of story-magic, fungal consciousness (Lichenwool Network), dream-seas, Baoist tree-bonding, Technomancer sigils, and Psychonaut lucid diving.

Generate a death that is:
1. Based on a REAL obscure way people have died in history
2. Creatively adapted to fit the Verse Layer's mystical/technological setting
3. Related to their choice (e.g., story-magic backfire, fungal network glitch, dream-drowning, tree rejection, sigil malfunction)
4. NOT any of these already used: ${usedDeaths.join(', ')}
5. Include a dramatic description under 100 words that blends the historical death with Verse Layer elements
6. Include the actual historical basis

Make it darkly humorous, mystical, and educational about both the Verse Layer and bizarre real deaths.`;

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
          content: 'You create darkly humorous death scenarios for the Verse Layer - a mystical realm where story-magic, fungal networks, and dream-seas intersect. Deaths should blend obscure real historical deaths with the fantastical elements of this universe (tree-bonding failures, sigil malfunctions, dream-drowning, narrative paradoxes). Be creative, educational, and unique.' 
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