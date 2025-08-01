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
  // Optional: notify Moni via WhatsApp API
};

const precios = {
  "uñas acrílicas": "$350 MXN",
  "pestañas clásicas": "$300 MXN",
  "lifting de cejas": "$280 MXN",
  "lifting de pestañas": "$280 MXN",
  bblips: "$400 MXN",
  acripie: "$220 MXN",
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

async function messageDispatcher({ phone, text, nlpResult, slotResult }) {
  console.log("📬 messageDispatcher START", {
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
      `Hola! Soy BeautyBot, la asistente de Beauty Blossoms en Zapopan, Jalisco. Podemos ofrecerte servicios de pestañas, uñas, cejas, enzimas, depilación y cabello. ¡Cuéntame, ¿qué servicio prefieres? Y ¿qué día te gustaría agendar tu cita? 😊`
    );
  }

  if (intent === "gratitude") {
    const fecha = slotResult?.fechaConfirmada || "tu próxima cita";
    return logAndSend(
      `¡Con mucho gusto! 😊 Te esperamos el ${fecha} en bb27 Studio 💅`
    );
  }

  if (intent === "faq_precio" && slotResult?.servicio) {
    const price = precios[slotResult.servicio.toLowerCase()];
    const reply = price
      ? `El precio de ${slotResult.servicio} en nuestro salón es de ${price}.`
      : `Ese servicio lo manejamos con precios variables. ¿Te gustaría saber más o agendar una cita? 😊`;
    return logAndSend(reply);
  }

  if (intent === "book_appointment") {
    const fecha = slotResult?.fecha;
    const hora = slotResult?.hora;
    const servicio = slotResult?.servicio;

    const price = servicio ? precios[servicio.toLowerCase()] : null;

    let reply = "Claro";
    if (servicio) {
      reply += `, podemos agendar tu cita para ${servicio}`;
      if (price) reply += ` (costo: ${price})`;
    }

    if (fecha && hora) {
      reply += ` el ${fecha} a las ${hora}. En unos momentos confirmamos la disponibilidad de tu cita ✨`;
    } else {
      reply += ". ";
      const prompts = [];
      if (!servicio) prompts.push("¿Qué servicio deseas?");
      if (!fecha) prompts.push("¿Qué día te gustaría agendar tu cita?");
      if (!hora) prompts.push("¿A qué hora te gustaría venir?");
      reply += prompts.join(" ");
    }

    await notifyMoni(
      phone,
      `Nueva cita solicitada: ${fecha || "fecha?"} ${hora || "hora?"} (${
        servicio || "servicio?"
      })`
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

module.exports = { messageDispatcher };
