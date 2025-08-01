const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

// 🔌 Imports
const { handleBotAction } = require("./messageDispatcher");
const { handleUnsupportedMedia } = require("./mediaHandler");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} = require("firebase-admin/firestore");

const classifyTier1 = require("./classifyTier1");
const classifyTier2 = require("./classifyTier2");
const classifyTier3 = require("./classifyTier3");

const db = getFirestore();
app.use(express.json());

// ✅ Meta webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "beauty-bot-token";
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
    const messageId = messageEntry.id;

    if (!phone || !messageText) {
      console.log("❌ Missing phone or message text");
      return res.status(200).send("Invalid payload");
    }

    console.log("📞 From:", phone);
    console.log("💬 Text:", messageText);

    // ✅ Deduplication logic
    const messageMetaRef = doc(db, "chats", phone, "metadata", "lastMessage");
    const previous = await getDoc(messageMetaRef);

    if (previous.exists() && previous.data().id === messageId) {
      console.log("🔁 Duplicate message detected. Skipping.");
      return res.status(200).send("Duplicate ignored");
    }

    await setDoc(messageMetaRef, { id: messageId });

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

    // 🧠 Tiered intent processing
    const tier1 = classifyTier1(messageText);
    if (tier1) {
      console.log("🎯 Matched Tier 1:", tier1);
      await handleBotAction({
        phone,
        text: messageText,
        nlpResult: tier1,
        slotResult: {},
      });
      return res.status(200).send("Tier 1 handled");
    }

    const tier2 = classifyTier2(messageText);
    if (tier2) {
      console.log("🔍 Matched Tier 2:", tier2);
      await handleBotAction({
        phone,
        text: messageText,
        nlpResult: tier2.nlpResult,
        slotResult: tier2.slotResult,
      });
      return res.status(200).send("Tier 2 handled");
    }

    const tier3 = await classifyTier3(messageText);
    console.log("🤖 Using Tier 3 AI:", tier3.nlpResult);
    await handleBotAction({
      phone,
      text: messageText,
      nlpResult: tier3.nlpResult,
      slotResult: tier3.slotResult,
    });

    return res.status(200).send("Tier 3 handled");
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
