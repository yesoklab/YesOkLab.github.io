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
    const { userMessage } = JSON.parse(event.body || "{}");
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;
    
    // 가장 안정적인 v1beta 주소 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 지침을 질문 앞에 합쳐서 보냄 (에러 방지 최적화)
            text: `지침: 당신은 WRISTORY의 전문 AI 도슨트입니다. 사용자의 질문 언어에 맞춰 한국어 혹은 영어로만 답변하세요. 역사와 NFT에 대해 친절하게 설명하세요.\n\n사용자 질문: ${userMessage}`
          }]
        }]
      })
    });

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }) };
  }
};
