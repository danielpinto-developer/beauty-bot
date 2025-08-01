// api_backend/messageDispatcher.js (or wherever you want it)
const { sendMessage } = require("./whatsapp");
const {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} = require("firebase-admin/firestore");
const { getOpenRouterReply } = require("./openrouterFallback");

const db = getFirestore();

const notifyMoni = async (phone, reason) => {
  console.log(`📣 Notify Moni: ${phone} needs manual follow-up (${reason})`);
};

async function handleBotAction({ phone, text, nlpResult, slotResult }) {
  const { intent, confidence, action, response } = nlpResult;

  // Log to "chats"
  await addDoc(collection(db, "chats", phone, "messages"), {
    sender: "user",
    text,
    intent,
    confidence,
    action,
    slots: slotResult,
    direction: "inbound",
    timestamp: serverTimestamp(),
  });

  if (action === "manual_review" || action === "manual_media_review") {
    await notifyMoni(phone, action);
  }

  let replyText = response;
  if (action === "fallback") {
    try {
      const gptResponse = await getOpenRouterReply(text);
      replyText = gptResponse;
    } catch (err) {
      console.error("❌ GPT fallback failed:", err);
      replyText = "Lo siento, hubo un error al procesar tu mensaje 🤖";
    }
  }

  // Log bot reply to "chats"
  await addDoc(collection(db, "chats", phone, "messages"), {
    sender: "bot",
    text: replyText,
    direction: "outbound",
    timestamp: serverTimestamp(),
  });

  await sendMessage({ to: phone, text: replyText });
}

module.exports = { handleBotAction };
