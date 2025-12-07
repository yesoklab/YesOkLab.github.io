// '통신 장비'를 사용하겠다고 선언
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const { userMessage } = JSON.parse(event.body);
        if (!userMessage) {
            return { statusCode: 400, body: 'Bad Request: userMessage is required.' };
        }
        const GEMINI_API_KEY = process.env.WRISTORY_GEMINI_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userMessage }] }],
                systemInstruction: { parts: [{ text: "You are the AI for the WRISTORY NFT project. Your name is 'WRISTORY Curator AI'. You must provide informative and respectful answers about Korean historical figures (like Ahn Jung-geun, Kim Gu), the Bitcoin Pizza Day event, and the airdrop process. If asked in Korean, you must reply in Korean. Keep your answers concise and helpful." }] }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response at this moment.";
        return { statusCode: 200, body: JSON.stringify({ reply }) };
    } catch (error) {
        console.error('Server-side error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal server error occurred." }) };
    }
};
