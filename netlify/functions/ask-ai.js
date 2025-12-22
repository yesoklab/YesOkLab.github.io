const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
  }

  try {
    const { userMessage } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) throw new Error("Netlify 환경 변수에 API 키가 설정되지 않았습니다.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: "당신은 역사를 기록하는 WRISTORY AI입니다. 한국어로 답변하세요." }] }
      })
    });

    const data = await response.json();
    
    // 구글 API가 에러를 보냈을 경우 로그에 출력
    if (data.error) {
      console.error("Google AI Error:", data.error.message);
      return { statusCode: 400, body: JSON.stringify({ reply: "AI 서버 에러: " + data.error.message }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("Function Error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ reply: "연결 실패: " + error.message }) };
  }
};
