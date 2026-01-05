// netlify/functions/ask-ai.js

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const { userMessage, lang } = JSON.parse(event.body || "{}");

    const API_KEY = process.env.WRISTORY_GEMINI_KEY;
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "API KEY missing" }),
      };
    }

    const fixedLang = lang === "en" ? "en" : "ko";
    const langInstruction =
      fixedLang === "en"
        ? "Answer in clear, calm English."
        : "차분하고 다큐멘터리 톤의 한국어로 답변하세요.";

    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = `
You are the official curator AI for the WRISTORY project.
${langInstruction}

User question:
${userMessage}
`.trim();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: "Server error" }),
    };
  }
};

