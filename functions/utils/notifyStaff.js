const axios = require("axios");
const functions = require("firebase-functions");
const config = functions.config();

const PHONE_NUMBER_ID = config.whatsapp.phone_number_id;
const ACCESS_TOKEN = config.whatsapp.access_token;
const MONI_NUMBER = config.whatsapp.moni_number;

const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

async function notifyMoni(appointment) {
  const { phone, service, timeSelected, msg } = appointment;

  const text = `
📣 *Nueva solicitud de cita*
Cliente: ${phone}
Servicio: ${service}
Horario solicitado: ${timeSelected}
${msg ? `Comentario del cliente: ${msg}` : ""}
📝 Favor de confirmar manualmente y agendar.
`;

  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: MONI_NUMBER,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error(
      "❌ Error notifying Moni:",
      err.response?.data || err.message
    );
  }
}

module.exports = {
  notifyMoni,
};
