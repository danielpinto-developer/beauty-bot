const patterns = [
  {
    keywords: ["pestañas", "volumen", "rimel", "efecto"],
    response:
      "¿Te interesa el efecto rímel, clásico, o algo más atrevido como colores o diseño wispy? ✨",
  },
  {
    keywords: ["uñas", "diseño", "gelish", "acrílicas", "rubber"],
    response:
      "¿Te interesan uñas acrílicas, soft gel, o algo más natural como rubber? 💅 Puedes enviarnos una foto si ya tienes un diseño en mente.",
  },
  {
    keywords: ["cejas", "henna", "laminado", "microblading"],
    response:
      "¿Buscas solo diseño, laminado HD o algo con pigmento como Henna o Microblading? 👁️",
  },
  {
    keywords: ["enzimas", "relleno", "labios"],
    response:
      "¿Te gustaría saber qué zonas tratamos con enzimas o ver los tonos disponibles para el relleno de labios? 💋",
  },
  {
    keywords: ["cabello", "botox", "nanoplastia", "keratina"],
    response:
      "¿Tu objetivo es alaciar el cabello o más bien reparar el daño? Podemos ayudarte a elegir entre botox, nanoplastia o keratina. 💇‍♀️",
  },
  {
    keywords: ["depilar", "depilación", "cera", "zonas"],
    response:
      "¿Qué zona te gustaría depilar? Tenemos paquetes especiales si combinas varias zonas. 🧼",
  },
];

async function handlePromptFollowUp(userPhone, message) {
  const text = message.toLowerCase();

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.response;
    }
  }

  return null; // no match
}

module.exports = {
  handlePromptFollowUp,
};
