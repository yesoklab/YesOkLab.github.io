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

    // 모델명 1.5-flash로 정확히 기입
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // 최신 환경에서는 require('node-fetch') 없이 바로 fetch를 사용합니다.
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: "당신은 WRISTORY NFT 프로젝트의 전문 큐레이터 AI입니다. 안중근, 김구 등 한국 독립운동가의 역사적 배경과 에어드랍 절차에 대해 친절하게 설명해주세요. 답변은 반드시 한국어로 하세요." }] }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 가져오지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("Error:", error);
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "AI 연결 실패", details: error.message }) 
    };
  }
};
