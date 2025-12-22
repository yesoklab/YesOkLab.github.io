exports.handler = async (event) => {
  // CORS 처리
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

    // 안정적인 v1 API와 gemini-1.5-flash 모델 사용
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: "당신은 한국의 독립운동가 시계를 NFT로 보존하는 WRISTORY 프로젝트의 AI 도슨트입니다. 사용자에게 한국어로 친절하게 역사를 설명해주세요." }] }
      })
    });

    const data = await response.json();

    // 에러 발생 시 처리
    if (data.error) {
      console.error("Google API Error:", data.error.message);
      return { 
        statusCode: 200, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "죄송합니다. AI 엔진 설정에 문제가 발생했습니다: " + data.error.message }) 
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }) 
    };
  }
};
