// openrouter.js
const fetch = require("node-fetch");

const systemPrompt = `
Eres BeautyBot, la asistente profesional y cálida de bb27 Studio (Beauty Blossoms), un salón en Zapopan, Jalisco.

Tu única función es dar información sobre nuestros servicios: pestañas, uñas, cejas, enzimas, depilación, cabello, etc.

Si te preguntan por precios, responde con los precios del salón. Nunca hables de tiendas, Amazon ni productos externos.

Siempre escribe en español, con un tono natural, humano y profesional. Usa máximo 3 oraciones. Puedes incluir un emoji cálido si aplica.

Siempre que des un precio, menciona que es en bb27 Studio y pregunta: "¿Qué día te gustaría agendar tu cita?" Nunca confirmes. Solo responde: "En unos momentos confirmamos la disponibilidad de tu cita ✨" si ya tienen fecha/hora.
`;

async function getOpenRouterReply(userText) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/mistralai/mixtral-8x7b-instruct",
      temperature: 0.4,
      max_tokens: 120,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            userText +
            "\n\nRecuerda: solo responde con servicios de Beauty Blossoms. No hables de Amazon, productos o salones externos. Sé breve.",
        },
      ],
    }),
  });

  const data = await res.json();
  const rawReply =
    data.choices?.[0]?.message?.content?.trim() || "Lo siento, no entendí eso.";

  // Enforce 3-sentence max truncation
  return rawReply
    .split(/(?<=[.!?])\s+/)
    .slice(0, 3)
    .join(" ");
}

module.exports = { getOpenRouterReply };
