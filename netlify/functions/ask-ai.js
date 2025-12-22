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
    const API_KEY = process.env.GEMINI_API_KEY;

    // 정확한 모델 명칭은 gemini-1.5-flash 입니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: "당신은 WRISTORY NFT 프로젝트의 전문 도슨트 AI입니다. 한국 독립운동가의 역사와 에어드랍 절차를 한국어로 친절하게 설명하세요." }] }
      })
    });

    const data = await response.json();

    // 구글 API 에러 핸들링
    if (data.error) {
      console.error("Google API Error:", data.error.message);
      return { 
        statusCode: 200, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "죄송합니다. AI 서버 설정 문제로 답변이 어렵습니다: " + data.error.message }) 
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
      body: JSON.stringify({ error: "Server Error", details: error.message }) 
    };
  }
};
