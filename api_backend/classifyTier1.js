// utils/classifyTier1.js

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function classifyTier1(text) {
  const msg = normalize(text);

  // --- Greetings ---
  const greetings = [
    "hola",
    "holi",
    "holis",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "que onda",
    "buen dia",
    "hi",
    "hello",
    "hey",
    "qué tal",
    "saludos",
  ];
  if (greetings.some((g) => msg.includes(g))) {
    return {
      intent: "greeting",
      response:
        "¡Hola! Bienvenida a bb27 Studio 🌸 ¿En qué te puedo ayudar hoy?",
    };
  }

  // --- Gratitude ---
  const thanks = [
    "gracias",
    "muchas gracias",
    "mil gracias",
    "te lo agradezco",
    "gracias hermosa",
    "gracias linda",
    "gracias guapa",
    "gracias amiga",
    "gracias bb",
    "thanks",
    "thank you",
  ];
  if (thanks.some((t) => msg.includes(t))) {
    return {
      intent: "gratitude",
      response: "¡Con mucho gusto! 😊 Te esperamos en bb27 Studio 💅",
    };
  }

  // --- Asking for Location ---
  const locationTriggers = [
    "donde estan",
    "donde se ubican",
    "ubicacion",
    "como llegar",
    "direccion",
    "donde es",
    "donde queda",
    "como llego",
    "me das la direccion",
    "en donde estan",
    "estan por zapopan",
  ];
  if (locationTriggers.some((p) => msg.includes(p))) {
    return {
      intent: "faq_location",
      response: "Estamos en Antequera 1294, Col. Lomas de Zapopan 📍",
    };
  }

  // --- Asking for Prices ---
  const priceTriggers = [
    "cuanto cuesta",
    "precio",
    "precios",
    "cuanto sale",
    "me cobras",
    "me costaria",
    "cuanto es",
    "cuanto me sale",
    "tarifa",
    "coste",
    "costaria",
    "cuanto valen",
    "cuanto cobran",
  ];
  if (priceTriggers.some((p) => msg.includes(p))) {
    return {
      intent: "faq_price",
      response:
        "Los precios varían según el servicio. ¿Qué te gustaría agendar? 💅",
    };
  }

  // --- Schedule Questions ---
  const scheduleTriggers = [
    "que horario tienen",
    "cual es su horario",
    "cuando abren",
    "cuando cierran",
    "estan abiertos",
    "atienden los sabados",
    "atienden hoy",
    "puedo ir hoy",
    "que dias trabajan",
    "horario de atencion",
    "de que hora a que hora",
    "trabajan fines de semana",
    "cual es el horario",
  ];
  if (scheduleTriggers.some((p) => msg.includes(p))) {
    return {
      intent: "faq_schedule",
      response: "Nuestro horario es de martes a sábado, 10am a 7pm 🕙",
    };
  }

  // --- Promotions ---
  const promoTriggers = [
    "promocion",
    "promos",
    "descuento",
    "oferta",
    "tienen alguna promo",
    "que promociones tienen",
    "hay descuento",
    "hay algo en promo",
    "ofertas",
    "rebajas",
  ];
  if (promoTriggers.some((p) => msg.includes(p))) {
    return {
      intent: "faq_promotions",
      response:
        "¡Sí! A veces tenemos promos especiales 🎉 Pregúntame por el servicio que te interesa.",
    };
  }

  // --- Services Overview ---
  const services = [
    "que servicios tienen",
    "que hacen",
    "que ofrecen",
    "que tratamientos hacen",
    "que puedo hacerme",
    "que hay disponible",
    "me puedes decir que tienen",
  ];
  if (services.some((p) => msg.includes(p))) {
    return {
      intent: "faq_services",
      response:
        "Ofrecemos uñas, pestañas, cejas, enzimas, faciales, depilación, y más ✨ ¿Qué te interesa?",
    };
  }

  // --- Payment Methods ---
  const payment = [
    "aceptan tarjeta",
    "se puede pagar con tarjeta",
    "pago con tarjeta",
    "se puede pagar con transferencia",
    "puedo pagar con efectivo",
    "formas de pago",
    "metodo de pago",
    "puedo hacer transferencia",
    "tienen terminal",
    "como se paga",
  ];
  if (payment.some((p) => msg.includes(p))) {
    return {
      intent: "faq_payment",
      response: "Aceptamos efectivo, transferencia y tarjeta 💳",
    };
  }

  return null; // Not Tier 1
}

module.exports = { classifyTier1 };
