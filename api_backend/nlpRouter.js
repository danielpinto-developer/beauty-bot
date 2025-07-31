const { classifyIntent } = require("../classifyIntent");
const { extractSlots } = require("../extractSlots");

async function nlpRouter(messageText) {
  try {
    const intentResult = await classifyIntent(messageText);
    const slotResult = await extractSlots(messageText);

    const { intent, confidence } = intentResult;
    const { fecha, hora, servicio } = slotResult;

    // Basic fallback threshold
    if (confidence < 0.6) {
      return {
        action: "fallback",
        response:
          "Lo siento, no entendí bien tu mensaje. ¿Podrías reformularlo? 🧠",
      };
    }

    // Requires human confirmation (based on intent or servicio keywords)
    const needsMoni = [
      "relleno labios",
      "micropigmentación",
      "bb glow",
      "bb lips",
      "extensiones",
      "volumen ruso",
      "volumen egipcio",
    ];
    if (
      intent === "requiere_confirmacion" ||
      (servicio && needsMoni.includes(servicio.toLowerCase()))
    ) {
      return {
        action: "manual_review",
        response:
          "Este servicio requiere confirmación de Moni, en unos momentos te apoyamos ✨",
      };
    }

    // Agenda intent logic
    if (intent === "agendar_cita") {
      if (fecha && hora && servicio) {
        return {
          action: "confirmable_request",
          response: `Perfecto 💖 Cita para *${servicio}* el *${fecha}* a las *${hora}*.
En unos momentos confirmamos la disponibilidad de tu cita ✨`,
        };
      } else {
        let missing = [];
        if (!fecha) missing.push("fecha");
        if (!hora) missing.push("hora");
        if (!servicio) missing.push("servicio");
        return {
          action: "ask_missing_info",
          response: `Solo necesito ${missing.join(
            ", "
          )} para agendar tu cita 💅`,
        };
      }
    }

    // Smalltalk, promos, prices, etc
    return {
      action: "informative",
      response: generateGenericResponse(intent, servicio),
    };
  } catch (error) {
    console.error("🧠 NLP Error:", error);
    return {
      action: "error",
      response:
        "Hubo un error procesando tu mensaje. Intenta de nuevo por favor 🙏",
    };
  }
}

function generateGenericResponse(intent, servicio) {
  switch (intent) {
    case "saludo":
      return "Hola hermosa 💖 ¿En qué te puedo ayudar hoy?";
    case "preguntar_precios":
      return `Con gusto. ¿Me puedes decir qué servicio te interesa${
        servicio ? `? Por ejemplo, *${servicio}*.` : "?"
      }`;
    case "solicitar_promociones":
      return "Esta semana tenemos varias promos activas ✨ ¿Te interesa algo en uñas, pestañas o cuidado facial?";
    case "preguntar_servicios":
      return "Ofrecemos pestañas, uñas, cejas, enzimas, depilación, cabello, y más 💖 ¿Qué te gustaría saber?";
    case "smalltalk":
      return "Gracias por tu mensaje 💖 Estoy para ayudarte cuando quieras.";
    case "objecion_cliente":
      return "Entendemos tus dudas 😌 Siempre buscamos ofrecerte calidad y resultados hermosos.";
    case "post_cuidado":
      return "¡Buena pregunta! ¿De qué servicio necesitas los cuidados post cita?";
    case "urgencia_cliente":
      return "Déjame verificar disponibilidad inmediata y te aviso en unos momentos ⏳";
    case "necesita_humana":
      return "Con gusto te canalizo con Moni 💬";
    default:
      return "¿Te puedo ayudar con algo relacionado a tus servicios de belleza? 💅";
  }
}

module.exports = { nlpRouter };
