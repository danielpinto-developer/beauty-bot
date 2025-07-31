const { sendMessage } = require("./whatsapp");
const { logConversation } = require("./firestoreLogger");
const { getOpenRouterReply } = require("./openrouterFallback");

// Optional: webhook URL, email, or internal ping to Moni
const notifyMoni = async (phone, reason) => {
  console.log(`📣 Notify Moni: ${phone} needs manual follow-up (${reason})`);
  // You could later send an internal message here (e.g. email, WhatsApp API, Slack)
};

async function handleBotAction({ phone, text, nlpResult, slotResult }) {
  const { intent, confidence, action, response } = nlpResult;

  // Always log
  await logConversation({
    phone,
    text,
    intent,
    confidence,
    action,
    slots: slotResult,
  });

  // Manual or media fallback → notify staff
  if (action === "manual_review" || action === "manual_media_review") {
    await notifyMoni(phone, action);
  }

  // Fallback route → GPT generation
  let replyText = response;
  if (action === "fallback") {
    const gptResponse = await getOpenRouterReply(text);
    replyText = gptResponse;
  }

  // Send final message to user
  await sendMessage({ to: phone, text: replyText });
}

module.exports = { handleBotAction };
