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

  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    const { userMessage, lang } = JSON.parse(event.body || "{}");
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;

    if (!API_KEY) {
      return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: "서버 설정 오류: API Key가 없습니다." }) };
    }

    // 언어 설정 고정
    const fixedLang = (lang === "en" || lang === "ko") ? lang : "ko";
    const langInstruction = fixedLang === "en" 
      ? "Respond in English only. Do not use Korean." 
      : "반드시 한국어로만 답변하세요. 영어를 섞지 마세요.";

    const prompt = `당신은 WRISTORY 프로젝트의 공식 가이드입니다. ${langInstruction}\n사용자 질문: ${userMessage}`;

    // ✅ 모델 후보군 수정 (존재하는 모델로 변경)
    const modelCandidates = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    let lastError = null;

    for (const model of modelCandidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: text }) };
        if (data?.error) lastError = data.error.message;
      } catch (e) { lastError = e.message; }
    }

    return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: `AI 연결 실패: ${lastError}` }) };
  } catch (error) {
    return { statusCode: 500, headers: baseHeaders, body: JSON.stringify({ reply: "서버 내부 오류" }) };
  }
};

