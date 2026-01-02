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

    // 가장 호환성이 좋은 v1beta 주소 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 지침: 언어 자동 감지 및 동일 언어 답변 명시
            text: `Instruction: You are the professional AI guide for WRISTORY. Detect the user's language (English or Korean) and respond ONLY in that same language. Explain Korean history and Bitcoin context clearly.\n\nUser Question: ${userMessage}`
          }]
        }]
      })
    });

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Response error.";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ reply: "Server error." }) };
  }
};
