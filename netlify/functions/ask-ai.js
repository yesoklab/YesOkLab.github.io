exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }
  const baseHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json; charset=utf-8" };
  try {
    const { userMessage, lang } = JSON.parse(event.body || "{}");
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;
    if (!API_KEY) return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: "API Key Missing" }) };

    // 언어 설정: 질문 언어에 맞게 지침 결합
    const prompt = `당신은 WRISTORY의 도슨트입니다. 사용자의 언어(한국어/영어)에 맞춰 해당 언어로만 답변하세요.\n질문: ${userMessage}`;

    // ✅ 검증된 모델명으로 수정
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: text }) };
    } else {
      return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ reply: "죄송합니다. 현재 AI 답변을 생성할 수 없습니다." }) };
    }
  } catch (error) {
    return { statusCode: 500, headers: baseHeaders, body: JSON.stringify({ reply: "서버 오류 발생" }) };
  }
};
