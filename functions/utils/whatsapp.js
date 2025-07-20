const axios = require("axios");
const functions = require("firebase-functions");
const config = functions.config();

const PHONE_NUMBER_ID = config.whatsapp.phone_number_id;
const ACCESS_TOKEN = config.whatsapp.token;

const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

// Send a plain text message via WhatsApp

async function sendTextMessage(recipientNumber, text) {
  try {
    const res = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: recipientNumber,
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

    console.log("✅ Message sent:", res.data);
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error sending text message:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Send an image (catalog flyer) via WhatsApp
 */
async function sendImageMessage(recipientNumber, imageUrl, caption = "") {
  try {
    const res = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: recipientNumber,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Image sent:", res.data);
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error sending image message:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  sendTextMessage,
  sendImageMessage,
};
