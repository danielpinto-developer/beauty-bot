const admin = require("firebase-admin");
const db = admin.firestore();

async function logChat({ phone, text, intent, confidence, action, slots }) {
  const ref = db.collection("chats").doc(phone).collection("messages");
  await ref.add({
    sender: "user",
    text,
    intent,
    confidence,
    action,
    slots,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = { logChat };
