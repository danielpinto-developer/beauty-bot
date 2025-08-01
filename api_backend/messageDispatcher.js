// api_backend/messageDispatcher.js
const { sendMessage } = require("./whatsapp");
const {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} = require("firebase-admin/firestore");
const { getOpenRouterReply } = require("./openrouterFallback");

const db = getFirestore();

const notifyMoni = async (phone, reason) => {
  console.log(`📣 Notify Moni: ${phone} needs manual follow-up (${reason})`);
};

async function handleBotAction({ phone, text, nlpResult, slotResult }) {
  console.log("📬 handleBotAction START", {
    phone,
    text,
    nlpResult,
    slotResult,
  });
  const { intent, confidence, action, response } = nlpResult;

  // Ensure the parent "chats/{phone}" doc exists so admin panel can see it
  try {
    await setDoc(
      doc(db, "chats", phone),
      {
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("⚠️ Failed to create parent chat doc:", err);
  }

  // Log user message to "chats/{phone}/messages"
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

  // Log bot reply to "chats/{phone}/messages"
  await addDoc(collection(db, "chats", phone, "messages"), {
    sender: "bot",
    text: replyText,
    direction: "outbound",
    timestamp: serverTimestamp(),
  });

  await sendMessage({ to: phone, text: replyText });
}

module.exports = { handleBotAction };
