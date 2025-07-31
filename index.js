const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

const { nlpRouter } = require("./nlpRouter");
const { handleBotAction } = require("./messageDispatcher");
const { handleUnsupportedMedia } = require("./mediaHandler");

app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const messageEntry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!messageEntry) return res.status(200).send("No message to process");

    const phone = messageEntry.from;
    const messageText = messageEntry.text?.body;

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
      return res.status(200).send("Invalid message");
    }

    const nlpResult = await nlpRouter(messageText);
    const slotResult = await require("./slotFiller").getSlotsFromText(
      messageText
    );

    await handleBotAction({ phone, text: messageText, nlpResult, slotResult });
    return res.status(200).send("Message processed");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Internal server error");
  }
});

app.get("/", (req, res) => {
  res.send("✅ WhatsApp NLP server is running");
});

app.listen(port, () => {
  console.log(`🔥 Server listening on port ${port}`);
});

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "beauty-bot-token"; // must match Meta

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
