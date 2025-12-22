exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
  }

  try {
    const { userMessage } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    // 1.5-flash 모델이 정확한 명칭입니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: "당신은 WRISTORY 프로젝트의 AI 도슨트입니다. 한국어로 친절하게 답변해주세요." }] }
      })
    });

    const data = await response.json();

    // 구글 서버 에러 메시지를 로그로 남겨서 확인 가능하게 함
    if (data.error) {
      console.error("Google API Error:", data.error.message);
      return { statusCode: 200, body: JSON.stringify({ reply: "구글 AI 설정 오류: " + data.error.message }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 찾을 수 없습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("Function Crash:", error.message);
    return { statusCode: 500, body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }) };
  }
};
