const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function logConversation({
  phone,
  text,
  intent,
  confidence,
  slots = {},
  action,
}) {
  const timestamp = new Date().toISOString();

  try {
    await db.collection("conversations").add({
      phone,
      text,
      intent,
      confidence,
      ...slots,
      action,
      timestamp,
    });
    console.log(`📥 Logged interaction for ${phone}`);
  } catch (err) {
    console.error("❌ Firestore log error:", err);
  }
}

module.exports = { logConversation };
