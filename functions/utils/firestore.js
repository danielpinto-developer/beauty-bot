const admin = require("firebase-admin");
const dayjs = require("dayjs");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const FIXED_TIMES = ["9am", "11am", "1pm", "3pm", "6pm"];
const DAYS_AHEAD = 14;

// Get available time slots from Firestore

async function getAvailableSlots() {
  const slots = [];
  const now = dayjs();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = now.add(i, "day");
    const dateStr = date.format("YYYY-MM-DD");
    const docRef = db.collection("available_slots").doc(dateStr);
    const doc = await docRef.get();

    if (!doc.exists) continue;

    const timeBlocks = doc.data().time_blocks;

    FIXED_TIMES.forEach((timeLabel) => {
      if (timeBlocks?.[timeLabel]) {
        const hour24 = convertTo24Hour(timeLabel);
        const slotDateTime = date.hour(hour24).minute(0);

        // Don’t include if slot is in the past
        if (slotDateTime.isAfter(now)) {
          slots.push({
            date: dateStr,
            time: timeLabel,
          });
        }
      }
    });
  }

  return slots;
}

function convertTo24Hour(label) {
  switch (label) {
    case "9am":
      return 9;
    case "11am":
      return 11;
    case "1pm":
      return 13;
    case "3pm":
      return 15;
    case "6pm":
      return 18;
    default:
      return 0;
  }
}

module.exports = {
  getAvailableSlots,
};
