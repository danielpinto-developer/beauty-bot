const { getOpenRouterReply } = require("./openrouter");
const { sendTextMessage } = require("./whatsapp");
const { db, Timestamp } = require("../functions/firebase");

const greetingIntents = {
  saludo: {
    match: /^(hola|buenas|hey|holi|holaa|qué tal|buen día)/i,
    response: "Hola guapa 😍 ¿En qué te puedo ayudar hoy?",
  },
};

const priceIntents = {
  pestañas: {
    match:
      /(pestañas|pestanas|clásicas|híbridas|volumen(?! hawaiano)|rimel|wispy|coreano)/i,
    response: `✨ Precios de pestañas:\n- Clásicas: $350\n- Híbridas: $400\n- Volumen: $450\n¿Qué día te gustaría venir?`,
  },
  hawaiano: {
    match: /(volumen hawaiano)/i,
    response: `🌺 Volumen hawaiano cuesta $480 en bb27 Studio. ¿Qué día te gustaría agendar tu cita?`,
  },
  uñas: {
    match:
      /(uñas|unas|acrílicas|acrilico|rubber|soft gel|gelish|manicura|spa)/i,
    response: `💅 Precios de uñas:\n- Acrílicas: $350\n- Gelish: $250\n- Rubber: $280\n- Soft Gel: $320\n¿Quieres agendar una cita?`,
  },
  cejas: {
    match: /(cejas|henna|laminado|pigmento)/i,
    response: `👁️ Precios de cejas:\n- Diseño + Pigmento: $180\n- Diseño + Henna: $200\n- Laminado HD: $350\n¿Te gustaría saber más o agendar?`,
  },
};

async function handleIncomingMessage(message) {
  console.log("📲 handleIncomingMessage START");

  const userText = message?.text?.body;
  const phone = message?.from;

  console.log("📞 Phone:", phone);
  console.log("💬 User Text:", userText);

  if (!userText || !phone) return;

  // 🔥 Firestore Logging
  const chatRef = db.collection("chats").doc(phone);
  const messagesRef = chatRef.collection("messages");

  await chatRef.set(
    {
      phone,
      lastUpdated: Timestamp.now(),
    },
    { merge: true }
  );

  await messagesRef.add({
    direction: "inbound",
    text: userText,
    timestamp: Timestamp.now(),
  });

  // 🥰 Greeting logic
  for (const key in greetingIntents) {
    if (greetingIntents[key].match.test(userText)) {
      const reply = greetingIntents[key].response;

      await messagesRef.add({
        direction: "outbound",
        text: reply,
        timestamp: Timestamp.now(),
      });

      await chatRef.update({ lastUpdated: Timestamp.now() });
      await sendTextMessage(phone, reply);
      return;
    }
  }

  // 🎯 Check hardcoded price intent
  for (const key in priceIntents) {
    if (priceIntents[key].match.test(userText)) {
      const hardcodedReply = priceIntents[key].response;

      await messagesRef.add({
        direction: "outbound",
        text: hardcodedReply,
        timestamp: Timestamp.now(),
      });

      await chatRef.update({ lastUpdated: Timestamp.now() });
      await sendTextMessage(phone, hardcodedReply);
      return;
    }
  }

  // 🧠 Fallback to AI reply
  let reply = await getOpenRouterReply(userText);

  // 🧩 Check for missing info
  const missingData = [];
  if (
    !userText.match(
      /(lunes|martes|miércoles|jueves|viernes|sábado|domingo|\d{1,2}\/\d{1,2})/i
    )
  ) {
    missingData.push("fecha");
  }
  if (!userText.match(/(mañana|tarde|\d{1,2} ?(am|pm)|[1-9] ?(am|pm)?)/i)) {
    missingData.push("hora");
  }
  if (!userText.match(/(pestañas|uñas|cejas|enzimas|cabello|depilación)/i)) {
    missingData.push("servicio");
  }

  if (missingData.length > 0) {
    reply += `\n\nPara poder agendar, necesito: ${missingData.join(
      ", "
    )}. ¿Me ayudas con eso?`;
  }

  await messagesRef.add({
    direction: "outbound",
    text: reply,
    timestamp: Timestamp.now(),
  });

  await chatRef.update({ lastUpdated: Timestamp.now() });

  await sendTextMessage(phone, reply);
}

module.exports = { handleIncomingMessage };
