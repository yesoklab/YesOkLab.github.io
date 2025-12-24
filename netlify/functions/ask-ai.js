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
    const { userMessage } = JSON.parse(event.body);
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;

    // v1 정식 버전 주소 사용
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 시스템 지침을 질문 내용과 합쳐서 보냄 (가장 확실한 방법)
            text: `지침: 당신은 WRISTORY 프로젝트의 전문 AI 도슨트입니다. 안중근, 김구 등 한국 독립운동가의 역사와 에어드랍 절차에 대해 한국어로 친절하게 설명해주세요.\n\n사용자 질문: ${userMessage}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return { 
        statusCode: 200, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "AI 서버 응답 오류: " + data.error.message }) 
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "서버 오류", details: error.message }) 
    };
  }
};
