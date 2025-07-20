from firebase_admin import firestore
from utils.firebase_availability import get_available_slots
from utils.notify_moni import notify_moni

db = firestore.client()

# List of required fields to collect before notifying Moni
REQUIRED_FIELDS = ["date", "time", "service"]

async def handle_user_message(message: str, phone: str) -> str:
    doc_ref = db.collection("chats").document(phone)
    doc = doc_ref.get()

    # Create or load conversation context
    context = doc.to_dict() if doc.exists else {}
    updates = {}

    message_lower = message.lower()

    # Step 1: Detect date
    if "hoy" in message_lower or "mañana" in message_lower:
        updates["date"] = "mañana" if "mañana" in message_lower else "hoy"

    elif "-" in message_lower and len(message_lower) >= 10:
        updates["date"] = message_lower.strip()[:10]  # crude YYYY-MM-DD support

    # Step 2: Detect time
    for slot in ["09:00", "11:00", "13:00", "15:00", "18:00"]:
        if slot in message:
            updates["time"] = slot
            break

    # Step 3: Detect service (lightweight)
    for word in ["pestañas", "uñas", "cejas", "enzimas", "labios", "facial", "corte", "tinte", "keratina", "alaciado"]:
        if word in message_lower:
            updates["service"] = word
            break

    # Update chat memory
    context.update(updates)
    doc_ref.set(context)

    # Prompt based on missing info
    missing = [key for key in REQUIRED_FIELDS if key not in context]

    if missing:
        if "date" in missing:
            return "¿Para qué día deseas tu cita? 📅 (ej. mañana o 2025-07-20)"
        elif "time" in missing:
            available = await get_available_slots(context.get("date", "mañana"))
            if available:
                return f"Tenemos estos horarios disponibles: {', '.join(available)} ⏰ ¿Cuál prefieres?"
            else:
                return "Lo siento, ese día está lleno 💔 ¿Quieres intentar otra fecha?"
        elif "service" in missing:
            return "¿Qué servicio te interesa? 💅 Puedes escribir: uñas, cejas, pestañas, etc."
    else:
        await notify_moni(
            name=phone,  # You can replace with user's name if known
            phone=phone,
            requested_time=f"{context['date']} {context['time']}",
            intent_data=context
        )
        return "¡Gracias guapa! En unos momentos confirmamos la disponibilidad de tu cita ✨"
