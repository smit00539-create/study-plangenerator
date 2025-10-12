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
    const { content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Extracting study data from content...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing study materials and extracting structured data about subjects, chapters, revisions, and custom study factors.
            
Extract the following information:
- Subject names
- Chapters (with lecture counts)
- Revision topics
- Custom study factors (like practice questions, notes, assignments, etc.)

Be precise and extract only what's explicitly mentioned in the content.`
          },
          {
            role: "user",
            content: content
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_study_data",
              description: "Extract structured study plan data including subjects, chapters, revisions, and custom factors",
              parameters: {
                type: "object",
                properties: {
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "Subject name"
                        },
                        preference_weight: {
                          type: "number",
                          description: "Priority weight (1-10, default 5)"
                        },
                        chapters: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              lectures_remaining: { type: "number" }
                            },
                            required: ["name", "lectures_remaining"]
                          }
                        },
                        revisions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" }
                            },
                            required: ["name"]
                          }
                        },
                        customFactorTypes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              typeName: { type: "string" },
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                    value: { type: "string" }
                                  },
                                  required: ["name", "value"]
                                }
                              }
                            },
                            required: ["typeName", "items"]
                          }
                        }
                      },
                      required: ["name", "chapters"]
                    }
                  }
                },
                required: ["subjects"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_study_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted data:", JSON.stringify(extractedData, null, 2));

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-study-data function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
