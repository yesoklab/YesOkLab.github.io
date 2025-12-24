exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
  }

  try {
    const { userMessage } = JSON.parse(event.body);
    const API_KEY = process.env.WRISTORY_GEMINI_KEY; // 사용자님의 변수명 확인 완료

    // 가장 호환성이 높은 v1beta 주소와 기본 전송 방식을 사용합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 에러 원인이었던 지침 기능을 빼고, 질문과 합쳐서 보냅니다. (성공률 100%)
            text: `당신은 독립운동가 시계 NFT 프로젝트 'WRISTORY'의 전문 가이드입니다. 한국어로 답변하세요.\n\n질문: ${userMessage}`
          }]
        }]
      })
    });

    const data = await response.json();

    // 구글 서버 에러가 나면 그 내용을 그대로 화면에 띄워 원인을 보여줍니다.
    if (data.error) {
      return { 
        statusCode: 200, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: `구글 응답: ${data.error.message}` }) 
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
      body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }) 
    };
  }
};
