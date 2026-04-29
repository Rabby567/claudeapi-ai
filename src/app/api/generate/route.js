// src/app/api/generate/route.js

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt must be a non-empty string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.ecomagent.in").replace(/\/$/, "");
    const apiKey  = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

    // Log config (key is masked for safety)
    console.log("BASE_URL:", baseUrl);
    console.log("API_KEY set:", !!apiKey);
    console.log("API_KEY prefix:", apiKey?.slice(0, 10));

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = {
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt.trim() }],
    };

    console.log("Calling:", `${baseUrl}/v1/messages`);
    console.log("Body:", JSON.stringify(body));

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    console.log("Status:", response.status);
    console.log("Response body:", raw);

    if (!response.ok) {
      let msg = "API request failed.";
      try {
        const data = JSON.parse(raw);
        msg = data?.error?.message || data?.message || raw || msg;
      } catch {}
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(raw);
    const text = data?.content?.[0]?.text ?? "No response generated.";
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
