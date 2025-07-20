const axios = require("axios");
const functions = require("firebase-functions");

const OPENROUTER_API_KEY = functions.config().openrouter.key;

const INTENT_LABELS = ["booking", "pricing", "cancelation", "unknown"];

async function detectIntent(userMessage) {
  const prompt = `
Detect the intent of the following user message. Return ONLY ONE of the following labels:
- booking
- pricing
- cancelation
- unknown

Message: "${userMessage}"
Label:
  `;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an intent classification system for a beauty salon chatbot. You reply only with exact labels, no extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 7000,
      }
    );

    const label = response.data.choices?.[0]?.message?.content
      ?.trim()
      .toLowerCase();

    return INTENT_LABELS.includes(label) ? label : "unknown";
  } catch (err) {
    console.error(
      "❌ OpenRouter intent error:",
      err.response?.data || err.message
    );
    return "unknown";
  }
}

module.exports = {
  detectIntent,
};
