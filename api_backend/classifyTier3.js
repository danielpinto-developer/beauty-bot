const { nlpRouter } = require("./nlpRouter");
const { getSlotsFromText } = require("./slotFiller");

async function classifyTier3(messageText) {
  try {
    const nlpResult = await nlpRouter(messageText);
    const slotResult = await getSlotsFromText(messageText);

    console.log("🎯 Tier 3 NLP Result:", nlpResult);
    console.log("🔍 Tier 3 Slot Result:", slotResult);

    return {
      nlpResult,
      slotResult,
    };
  } catch (err) {
    console.error("❌ classifyTier3 error:", err);
    return {
      nlpResult: {
        intent: "unknown",
        confidence: 0,
        action: "fallback",
        response: "Lo siento, no entendí muy bien eso 🤖",
      },
      slotResult: {},
    };
  }
}

module.exports = classifyTier3;
