// src/app/api/generate/route.js
// EcomAgent API — uses OpenAI-compatible /v1/chat/completions format

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt must be a non-empty string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // EcomAgent uses OpenAI-compatible chat/completions endpoint
    const response = await fetch("https://api.ecomagent.in/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt.trim() }],
        max_tokens: 1024,
      }),
    });

    const raw = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", raw.slice(0, 500));

    if (!response.ok) {
      let msg = "API request failed.";
      try {
        const data = JSON.parse(raw);
        msg = data?.error?.message || data?.message || data?.error || msg;
      } catch {}
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // OpenAI-compatible response format
    const data = JSON.parse(raw);
    const text = data?.choices?.[0]?.message?.content ?? "No response generated.";

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (err) {
    console.error("Fetch error:", err);
    return new Response(
      JSON.stringify({ error: `Network error: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
