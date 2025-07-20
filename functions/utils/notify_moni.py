from firebase_admin import firestore
from datetime import datetime

db = firestore.client()

async def notify_moni(name: str, phone: str, requested_time: str, intent_data: dict):
    """
    Logs a pending booking request so Moni can review and confirm it later.
    Shows up under 'Solicitudes Pendientes' in the admin dashboard.
    """
    try:
        pending_ref = db.collection("pending_requests").document(phone)
        pending_ref.set({
            "name": name,
            "phone": phone,
            "requested_time": requested_time,
            "intent_data": intent_data,
            "status": "pending",
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        print(f"✅ Pending request saved for {phone}")
    except Exception as e:
        print("❌ Error notifying Moni:", str(e))
