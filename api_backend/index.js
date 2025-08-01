const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

// 🔌 Imports
const { nlpRouter } = require("./nlpRouter");
const { handleBotAction } = require("./messageDispatcher");
const { handleUnsupportedMedia } = require("../mediaHandler");
const { getSlotsFromText } = require("./slotFiller");

app.use(express.json());

// ✅ Meta webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "beauty-bot-token"; // must match Meta config
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// 📩 Message processing
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const messageEntry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!messageEntry) {
      console.log("⚠️ No message found in webhook payload.");
      return res.status(200).send("No message to process");
    }

    const phone = messageEntry.from;
    const messageText = messageEntry.text?.body;

    console.log("📞 From:", phone);
    console.log("💬 Text:", messageText);

    // 🎥 Media handling
    const mediaCheck = handleUnsupportedMedia(messageEntry);
    if (mediaCheck) {
      await handleBotAction({
        phone: mediaCheck.phone,
        text: `[${messageEntry.type} message]`,
        nlpResult: {
          intent: "media",
          confidence: 1,
          action: mediaCheck.action,
          response: mediaCheck.response,
        },
        slotResult: {},
      });
      return res.status(200).send("Handled media manually");
    }

    if (!messageText || !phone) {
      console.log("❌ Invalid message: missing text or phone");
      return res.status(200).send("Invalid message");
    }

    // 🧠 NLP & Slot Filling
    const nlpResult = await nlpRouter(messageText);
    const slotResult = await getSlotsFromText(messageText);

    console.log("🚀 Webhook received:", { phone, messageText });
    console.log("🧠 NLP Result:", nlpResult);
    console.log("🧠 Slot Result:", slotResult);

    await handleBotAction({ phone, text: messageText, nlpResult, slotResult });

    console.log("✅ handleBotAction completed");

    return res.status(200).send("Message processed");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).send("Internal server error");
  }
});

// Healthcheck
app.get("/", (req, res) => {
  res.send("✅ WhatsApp NLP server is running");
});

app.listen(port, () => {
  console.log(`🔥 Server listening on port ${port}`);
});
