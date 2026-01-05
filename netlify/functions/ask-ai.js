// netlify/functions/ask-ai.js

exports.handler = async (event) => {
  // CORS preflight
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
        body: JSON.stringify({ reply: "서버 설정 오류: WRISTORY_GEMINI_KEY가 비어있습니다." }),
      };
    }

    // ✅ 언어 고정 (B 방식): 프론트 KO/EN 토글 값으로 강제
    const fixedLang = (lang === "en" || lang === "ko") ? lang : "ko";
    const langInstruction =
      fixedLang === "en"
        ? "Answer in English only."
        : "한국어로만 답변하세요.";

    // ✅ 안정적으로 동작하는 모델(당신 환경에서 이미 성공한 v1beta + 1.5 flash 유지)
    // ✅ 안정 모델
const model = "gemini-1.5-flash-latest";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;


    const prompt = `
You are the official guide for the WRISTORY project (Digital Heritage NFT on Tezos).
${langInstruction}

Rules:
- Keep answers clear and helpful.
- If user asks about a historical figure, give a concise summary + key facts + why WRISTORY features them.
- If user asks about airdrop/how-to, answer with step-by-step instructions.

User question:
${userMessage || ""}
`.trim();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY, // ✅ 헤더 방식
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (data?.error?.message) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: `구글 응답: ${data.error.message}` }),
      };
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }),
    };
  }
};

