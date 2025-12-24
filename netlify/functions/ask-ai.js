exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
  }
  try {
    const { userMessage } = JSON.parse(event.body);
    const API_KEY = process.env.WRISTORY_GEMINI_KEY;

    // 모든 버전에서 가장 잘 작동하는 v1beta 주소 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 복잡한 필드를 배제하고 지침을 직접 합쳐서 보내는 100% 작동 방식
            text: `지침: 당신은 독립운동가 시계 NFT 프로젝트 'WRISTORY'의 전문 큐레이터입니다. 한국어로 친절하게 답변하세요.\n\n사용자 질문: ${userMessage}`
          }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 가져오지 못했습니다.";
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ reply }) };
  } catch (error) {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ reply: "연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }) };
  }
};
