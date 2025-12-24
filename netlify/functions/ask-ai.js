exports.handler = async (event) => {
  // CORS preflight
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

    const API_KEY = process.env.WRISTORY_GEMINI_KEY; // Netlify 환경변수 이름과 일치해야 함
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: "서버 설정 오류: WRISTORY_GEMINI_KEY가 비어있습니다." }),
      };
    }

    // ✅ v1beta + 지원 모델로 변경 (문서 예시)
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ✅ 권장: 쿼리스트링 key= 말고 헤더로 전달
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `당신은 독립운동가 시계 NFT 프로젝트 'WRISTORY'의 전문 가이드입니다. 한국어로 답변하세요.\n\n질문: ${userMessage || ""}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data?.error?.message) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ reply: `구글 응답: ${data.error.message}` }),
      };
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: "서버 연결 오류가 발생했습니다." }),
    };
  }
};

