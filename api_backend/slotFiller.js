const { extractSlots } = require("./extractSlots");

async function getSlotsFromText(text) {
  const slots = {
    fecha: null,
    hora: null,
    servicio: null,
  };

  try {
    const nerResult = await extractSlots(text);

    // Only assign if spaCy gives you something valid
    if (nerResult) {
      if (nerResult.fecha) slots.fecha = nerResult.fecha;
      if (nerResult.hora) slots.hora = nerResult.hora;
      if (nerResult.servicio) slots.servicio = nerResult.servicio;
    }
  } catch (err) {
    console.error("❌ spaCy slot filler failed:", err);
  }

  // 🗓️ Regex fallback for date
  if (!slots.fecha) {
    if (/hoy/i.test(text)) {
      slots.fecha = "hoy";
    } else if (/mañana/i.test(text)) {
      slots.fecha = "mañana";
    } else if (/pasado\s*mañana/i.test(text)) {
      slots.fecha = "pasado mañana";
    } else {
      const diaSemana = text.match(
        /\b(?:el\s+)?(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i
      );
      if (diaSemana) slots.fecha = diaSemana[1].toLowerCase();
    }
  }

  // 🕒 Regex fallback for time
  if (!slots.hora) {
    const horaMatch = text.match(
      /\b(?:a\s*las\s*)?(\d{1,2}(?::\d{2})?\s*(am|pm)?|\d{1,2})\b/i
    );
    if (horaMatch) {
      slots.hora = horaMatch[1].toLowerCase();
    }
  }

  console.log("🎯 Final slots:", slots);
  return slots;
}

module.exports = { getSlotsFromText };
