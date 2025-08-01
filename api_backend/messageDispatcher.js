const { sendMessage } = require("./whatsapp");
const {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} = require("firebase-admin/firestore");
const { getOpenRouterReply } = require("./openrouterFallback");

const db = getFirestore();

const notifyMoni = async (phone, reason) => {
  console.log(`📣 Notify Moni: ${phone} needs manual follow-up (${reason})`);
};

async function logMessage({
  phone,
  text,
  sender,
  direction,
  intent = null,
  confidence = null,
  action = null,
  slots = null,
}) {
  const data = {
    text,
    sender,
    direction,
    timestamp: serverTimestamp(),
  };

  if (intent) data.intent = intent;
  if (confidence) data.confidence = confidence;
  if (action) data.action = action;
  if (slots) data.slots = slots;

  await addDoc(collection(db, "chats", phone, "messages"), data);
}

async function handleBotAction({ phone, text, nlpResult, slotResult }) {
  console.log("📬 handleBotAction START", {
    phone,
    text,
    nlpResult,
    slotResult,
  });

  const { intent, confidence, action, response } = nlpResult;

  // Ensure parent doc exists
  try {
    await setDoc(
      doc(db, "chats", phone),
      { last_updated: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("⚠️ Failed to set parent chat doc:", err);
  }

  // Log inbound user message
  await logMessage({
    phone,
    text,
    sender: "user",
    direction: "inbound",
    intent,
    confidence,
    action,
    slots: slotResult,
  });

  if (action === "manual_review" || action === "manual_media_review") {
    await notifyMoni(phone, action);
  }

  let replyText = response;
  if (action === "fallback") {
    try {
      replyText = await getOpenRouterReply(text);
    } catch (err) {
      console.error("❌ GPT fallback failed:", err);
      replyText = "Lo siento, hubo un error al procesar tu mensaje 🤖";
    }
  }

  // Log outbound bot reply
  await logMessage({
    phone,
    text: replyText,
    sender: "bot",
    direction: "outbound",
  });

  // Send WhatsApp reply
  await sendMessage({ to: phone, text: replyText });
}

module.exports = { handleBotAction };
