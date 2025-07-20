const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { sendTextMessage } = require("./utils/whatsapp");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { seedNextDayIfMissing } = require("./utils/dailySlotSeeder");
const config = functions.config();
const VERIFY_TOKEN = "beauty-bot-token";
const OPENROUTER_KEY = config.openrouter.key;

const app = express();
app.use(bodyParser.json());

// Webhook Verification (GET)

app.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook Handler (POST from WhatsApp)
app.post("/", async (req, res) => {
  try {
    const body = req.body;

    if (
      body.object === "whatsapp_business_account" &&
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const msgBody = message.text?.body || "";

      // 1. Save user message
      await db.collection("chats").doc(from).collection("messages").add({
        sender: "user",
        text: msgBody,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Get OpenRouter reply
      const reply = await getReplyFromOpenRouter(msgBody);

      // 3. Save bot reply
      await db.collection("chats").doc(from).collection("messages").add({
        sender: "bot",
        text: reply,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Send back to WhatsApp
      await sendTextMessage(from, reply);

      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    console.error("❌ Error in /webhook:", err);
    res.sendStatus(500);
  }
});

// OpenRouter Reply Helper
async function getReplyFromOpenRouter(prompt) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente de belleza para un salón llamado Beauty Blossoms. Responde de forma amigable y profesional.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Lo siento, no entendí eso.";
  } catch (error) {
    console.error("❌ OpenRouter error:", error);
    return "Hubo un problema generando la respuesta.";
  }
}

exports.webhook = functions.https.onRequest(app);

// Daily Seeder
exports.dailySlotSeeder = functions.pubsub
  .schedule("every day 06:00")
  .timeZone("America/Mexico_City")
  .onRun(async () => {
    console.log("⏰ Running daily slot seeder...");
    await seedNextDayIfMissing();
  });

// Confirmation Message Sender
exports.sendConfirmationWhatsApp = functions.https.onRequest(
  async (req, res) => {
    const { phone, name, service, date, time } = req.body;

    if (!phone || !name || !service || !date || !time) {
      return res.status(400).send("❌ Missing required fields.");
    }

    const message = `✅ Hola ${name}, tu cita para *${service}* ha sido confirmada.\n📅 ${date} a las ${time}\nGracias por elegir Beauty Blossoms ✨`;

    try {
      await sendTextMessage(phone, message);
      console.log(`✅ Message sent to ${phone}`);
      return res.status(200).send("✅ Message sent.");
    } catch (err) {
      console.error("❌ Error sending WhatsApp message:", err.message);
      return res.status(500).send("❌ Failed to send message.");
    }
  }
);

// OpenRouter Callable (admin UI)
exports.chatWithOpenRouter = functions.https.onCall(async (data, context) => {
  const prompt = data.prompt;

  try {
    const response = await getReplyFromOpenRouter(prompt);
    return response;
  } catch (err) {
    console.error("❌ Error:", err);
    throw new functions.https.HttpsError("internal", "OpenRouter error");
  }
});
