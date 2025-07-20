const admin = require("firebase-admin");
const dayjs = require("dayjs");
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const STAFF = ["Hatzi", "Vale", "Lucy"];
const TIMES = ["9:00", "11:00", "13:00", "15:00", "18:00"];

async function seedNextDayIfMissing() {
  const targetDate = dayjs().add(14, "day").format("YYYY-MM-DD");

  for (const staff of STAFF) {
    const docRef = db.collection("availability").doc(`${staff}_${targetDate}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({
        date: targetDate,
        staff,
        slots: TIMES,
      });
      console.log(`✅ Seeded slots for ${staff} on ${targetDate}`);
    } else {
      console.log(`⏩ Slots already exist for ${staff} on ${targetDate}`);
    }
  }
}

module.exports = {
  seedNextDayIfMissing,
};
