exports.handler = async (event) => {
  // 브라우저 보안(CORS) 처리
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
    // 사용자님이 지정하신 환경 변수 이름으로 변경 완료
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;

    // v1beta 주소여야 시스템 지침(AI 역할 설정)이 작동합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        // 구글 REST API 표준인 system_instruction(언더바) 사용
        system_instruction: { parts: [{ text: "당신은 WRISTORY 프로젝트의 AI 도슨트입니다. 한국 독립운동가에 대해 한국어로 친절하게 답변하세요." }] }
      })
    });

    const data = await response.json();

    if (data.error) {
      return { 
        statusCode: 200, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "AI 설정 오류: " + data.error.message }) 
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 가져오지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "연결 오류", details: error.message }) 
    };
  }
};
