exports.handler = async (event) => {
  // --- CORS Preflight ---
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

  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    const { userMessage, lang } = JSON.parse(event.body || "{}");

    const API_KEY = process.env.WRISTORY_GEMINI_KEY;
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers: baseHeaders,
        body: JSON.stringify({ reply: "서버 설정 오류: WRISTORY_GEMINI_KEY가 비어있습니다." }),
      };
    }

    const fixedLang = (lang === "en" || lang === "ko") ? lang : "ko";
    const langInstruction =
      fixedLang === "en"
        ? "Answer in English only. Do not use Korean."
        : "한국어로만 답변하세요. 영어를 섞지 마세요.";

    const prompt = `
You are the official guide for the WRISTORY project (Digital Heritage NFT on Tezos).
${langInstruction}

Rules:
- Be clear, concise, and helpful.
- If user asks about a historical figure: give (1) short summary (2) key facts (3) why WRISTORY features them.
- If user asks about airdrop/how-to: give step-by-step instructions.
- If the user message is too short or unclear, ask one short follow-up question.

User question:
${userMessage || ""}
`.trim();

    const modelCandidates = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let lastError = null;

    for (const model of modelCandidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          }),
        });

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return {
            statusCode: 200,
            headers: baseHeaders,
            body: JSON.stringify({ reply: text, usedModel: model, fixedLang }),
          };
        }
        if (data?.error?.message) lastError = data.error.message;
      } catch (e) {
        lastError = e.message;
      }
    }

    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ reply: "답변을 생성하지 못했습니다. " + lastError }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }),
    };
  }
};
