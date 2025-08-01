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
  // TODO: optionally send WhatsApp alert to Moni here
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

  try {
    await setDoc(
      doc(db, "chats", phone),
      { last_updated: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("⚠️ Failed to set parent chat doc:", err);
  }

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

  if (intent === "greeting") {
    return logAndSend(
      "¡Hola! Bienvenida a bb27 Studio 🌸 ¿En qué te puedo ayudar hoy?"
    );
  }

  if (intent === "gratitude") {
    const fecha = slotResult?.fechaConfirmada || "tu próxima cita";
    return logAndSend(
      `¡Con mucho gusto! 😊 Te esperamos el ${fecha} en bb27 Studio 💅`
    );
  }

  if (intent === "book_appointment") {
    const fecha = slotResult?.fecha || "una fecha por confirmar";
    const hora = slotResult?.hora || "una hora por confirmar";
    const servicio = slotResult?.servicio || "el servicio deseado";
    const reply = `¡Claro! Agendamos para ${fecha} a las ${hora} para ${servicio}. En unos momentos confirmamos la disponibilidad ✨`;

    await notifyMoni(
      phone,
      `Nueva cita solicitada: ${fecha} ${hora} (${servicio})`
    );
    return logAndSend(reply);
  }

  if (intent === "confirm_availability") {
    const fecha = slotResult?.fecha || "tu cita";
    const hora = slotResult?.hora || "la hora acordada";
    const reply = `✅ Cita confirmada para ${fecha} a las ${hora}. Aquí te dejo los datos para enviar el anticipo de $100 MXN:

💳 Banco BBVA
CLABE: 012345678901234567
Nombre: Beauty Blossoms

Una vez hecho el pago, mándanos el comprobante 💖`;
    return logAndSend(reply);
  }

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

  return logAndSend(replyText);

  async function logAndSend(textToSend) {
    await logMessage({
      phone,
      text: textToSend,
      sender: "bot",
      direction: "outbound",
    });
    await sendMessage({ to: phone, text: textToSend });
  }
}

module.exports = { handleBotAction };
