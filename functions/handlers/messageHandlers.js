const { sendTextMessage, sendImageMessage } = require("../utils/whatsapp");
const { getAvailableSlots } = require("../utils/firestore");
const { getCatalogImageForService } = require("../utils/catalog");
const { notifyMoni } = require("../utils/notifyStaff");
const { detectIntent } = require("../ai/intentClassifier");
const { handlePromptFollowUp } = require("../ai/miniPromptChains");

let sessionMemory = {};

async function handleIncomingMessage(userPhone, userMessage) {
  const lower = userMessage.toLowerCase();

  // Run intent classification (booking, price, etc.)
  const intent = await detectIntent(userMessage);

  // Handle fuzzy prompt chaining for vague requests
  const followUp = await handlePromptFollowUp(userPhone, userMessage);
  if (followUp) {
    await sendTextMessage(userPhone, followUp);
    return;
  }

  // Check if message matches a known service
  const service = detectServiceKeyword(lower);
  if (service) {
    const catalogImg = getCatalogImageForService(service);
    await sendImageMessage(
      userPhone,
      catalogImg,
      `Aquí tienes más info sobre ${service} ✨`
    );

    // Store selected service in sessionMemory
    sessionMemory[userPhone] = { service };
    await sendTextMessage(
      userPhone,
      `¿Qué día te gustaría tu cita? Tenemos horarios a las 9am, 11am, 1pm, 3pm y 6pm los próximos 14 días.`
    );
    return;
  }

  // If user mentions a time or day, try booking
  if (
    lower.includes("mañana") ||
    lower.includes("lunes") ||
    lower.match(/\d{1,2}(am|pm)/)
  ) {
    const previous = sessionMemory[userPhone];
    if (previous?.service) {
      const available = await getAvailableSlots();

      const slotText = available
        .map((s) => `🕐 ${s.date} a las ${s.time}`)
        .join("\n");
      await sendTextMessage(
        userPhone,
        `Estos son nuestros horarios disponibles:\n${slotText}`
      );
      await sendTextMessage(
        userPhone,
        `¿Cuál te gustaría? Responde con el horario exacto (ej. “lunes a las 11am”)`
      );

      sessionMemory[userPhone].step = "awaiting_confirmation";
      return;
    }
  }

  // User confirms a time (simple time regex)
  if (sessionMemory[userPhone]?.step === "awaiting_confirmation") {
    const appointment = {
      phone: userPhone,
      service: sessionMemory[userPhone].service,
      timeSelected: userMessage,
    };

    await sendTextMessage(
      userPhone,
      `¡Perfecto! En unos momentos confirmamos tu cita 🕒`
    );
    await notifyMoni(appointment);
    delete sessionMemory[userPhone];
    return;
  }

  // Handle known intent if no service match
  if (intent === "pricing") {
    await sendTextMessage(
      userPhone,
      `Podemos darte precios exactos después de saber qué servicio te interesa y confirmar horario. ¿Cuál te gustaría?`
    );
    return;
  }

  if (intent === "cancelation") {
    await sendTextMessage(
      userPhone,
      `Para cancelar o cambiar tu cita, una asesora te apoyará en breve 💬`
    );
    await notifyMoni({
      phone: userPhone,
      intent: "cancelation",
      msg: userMessage,
    });
    return;
  }

  // Unknown input — fallback
  await sendTextMessage(
    userPhone,
    `Una asesora te responderá en breve 💬 mientras tanto, ¿te gustaría ver nuestros servicios o agendar una cita?`
  );
}

function detectServiceKeyword(text) {
  const services = [
    "uñas",
    "pestañas",
    "cejas",
    "enzimas",
    "depilación",
    "cabello",
    "relleno",
    "micropigmentación",
    "hidralips",
  ];
  return services.find((keyword) => text.includes(keyword));
}

module.exports = {
  handleIncomingMessage,
};
