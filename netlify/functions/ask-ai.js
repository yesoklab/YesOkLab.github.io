// netlify/functions/ask-ai.js

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

    // ✅ B 방식: 프론트에서 넘어온 lang 값으로 언어 고정
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

    // ✅ 안정성: 모델 fallback (not found 방지)
    const modelCandidates = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];

    let lastError = null;

    for (const model of modelCandidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // (선택) 안전 세팅
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      const data = await response.json();

      // 성공 응답
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          statusCode: 200,
          headers: baseHeaders,
          body: JSON.stringify({ reply: text, usedModel: model, fixedLang }),
        };
      }

      // 에러 응답이면 다음 모델로
      if (data?.error?.message) {
        lastError = `구글 응답(${model}): ${data.error.message}`;
        continue;
      }

      lastError = `알 수 없는 응답 형식(${model}).`;
    }

    // 모든 모델 실패
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ reply: lastError || "답변을 생성하지 못했습니다." }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다.", detail: String(error) }),
    };
  }
};

