const { extractSlots } = require("../extractSlots");

async function getSlotsFromText(text) {
  try {
    const result = await extractSlots(text);
    return result;
  } catch (err) {
    console.error("❌ Slot filler error:", err);
    return {
      fecha: null,
      hora: null,
      servicio: null,
    };
  }
}

module.exports = { getSlotsFromText };
