// classifyTier2.js

function classifyTier2(text) {
  if (!text || typeof text !== "string") return null;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  // Booking intent patterns
  const bookKeywords = [
    /\b(quiero|quisiera|me interesa|me gustaria|podria|puedo|voy a)\b.*\b(cita|agendar|reservar|servicio|espacio)\b/,
    /\b(cita|agendar|reservar|espacio)\b.*\b(una|para|de|en)/,
    /\b(tienen|hay)\b.*\b(disponibilidad|agenda|espacio|hora|fecha)/,
    /\b(agenda|calendario|cupo|turno|apartado|disponibles?)\b/,
    /\b(quiero|puedo|necesito)\b.*\b(ir|asistir|atender|hacerme)\b/,
    /\b(agendame|reservame|apunta|anotame)\b/,
    /\b(puedo)?\s?(hacer|agendar|programar).*\b(cita|servicio)/,
  ];

  // Service mentions
  const serviceKeywords = [
    /u[ñn]as|manicura|pedicura|acrilicas|gelish|manicure|nail/,
    /pesta[ñn]as|extensiones|lifting/,
    /cejas|dise[ñn]o de ceja|henna|depilar/,
    /facial|limpieza|enzimas|hidrataci[óo]n/,
    /bbglow|dermapen|peeling/,
    /cabello|tinte|mechas|corte|keratina|planchado|alisado|peinado/,
    /maquillaje|makeup/,
    /depilaci[óo]n|cera|axilas|piernas/,
    /masaje|relajaci[óo]n|drenaje/,
  ];

  const matchesBooking = bookKeywords.some((pattern) =>
    pattern.test(normalized)
  );
  const mentionsService = serviceKeywords.some((pattern) =>
    pattern.test(normalized)
  );

  if (matchesBooking || mentionsService) {
    return {
      intent: "book_appointment",
      confidence: 0.95,
      action: "collect_booking_info",
      response:
        "\u00a1Claro! \u00bfPara qu\u00e9 d\u00eda y a qu\u00e9 hora te gustar\u00eda agendar tu cita?",
    };
  }

  return null;
}

module.exports = classifyTier2;
