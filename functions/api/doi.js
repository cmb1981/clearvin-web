export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const text = (body?.text || "").toString().slice(0, 20000);

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing input text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are CLEARVIN, a neutral, interpretive AI that explains vehicle purchase and lease agreements without selling or recommending.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.2,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "OpenAI error" }), {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const output =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "No response generated.";

    return new Response(JSON.stringify({ output }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
