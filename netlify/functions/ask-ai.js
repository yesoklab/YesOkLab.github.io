exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  }

  try {
    const { userMessage } = JSON.parse(event.body || "{}");
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;

    if (!API_KEY) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "서버 환경변수 WRISTORY_GEMINI_KEY가 설정되지 않았습니다." })
      };
    }

    // ✅ v1beta에서 안정적으로 동작하는 모델로 변경
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 독립운동가 시계 NFT 프로젝트 'WRISTORY'의 전문 가이드입니다. 한국어로 답변하세요.\n\n질문: ${userMessage || ""}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: `구글 응답: ${data.error.message}` })
      };
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "답변을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: `서버 연결 오류가 발생했습니다: ${error.message}` })
    };
  }
};

