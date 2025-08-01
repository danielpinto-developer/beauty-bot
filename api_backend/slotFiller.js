const { extractSlots } = require("./extractSlots");

async function getSlotsFromText(text) {
  const slots = {
    fecha: null,
    hora: null,
    servicio: null,
  };

  try {
    const nerResult = await extractSlots(text);
    if (nerResult) {
      slots.fecha = nerResult.fecha || null;
      slots.hora = nerResult.hora || null;
      slots.servicio = nerResult.servicio || null;
    }
  } catch (err) {
    console.error("❌ spaCy slot filler failed:", err);
  }

  // 🗓️ Basic date expressions
  if (/hoy/i.test(text)) slots.fecha = "hoy";
  else if (/mañana/i.test(text)) slots.fecha = "mañana";
  else if (/pasado\s*mañana/i.test(text)) slots.fecha = "pasado mañana";
  else {
    const diaSemana = text.match(
      /\b(?:el\s+)?(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i
    );
    if (diaSemana) slots.fecha = diaSemana[1];
  }

  // 🕒 Basic time expressions (e.g. "10am", "a las 15:00", "3:30 pm")
  const horaMatch = text.match(
    /\b(?:a\s*las\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2})\b/i
  );
  if (horaMatch) slots.hora = horaMatch[1];

  return slots;
}

module.exports = { getSlotsFromText };
