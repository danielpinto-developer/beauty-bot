function handleUnsupportedMedia(messageEntry) {
  const type = messageEntry.type;
  const phone = messageEntry.from;

  // Only respond if it's media we can't handle
  if (["audio", "image", "sticker", "video", "document"].includes(type)) {
    return {
      phone,
      response:
        "¡Gracias por tu mensaje! 🙌 En unos momento respondemos.. Moni te responderá personalmente muy pronto ✨",
      action: "manual_media_review",
    };
  }

  return null; // no action needed
}

module.exports = { handleUnsupportedMedia };
