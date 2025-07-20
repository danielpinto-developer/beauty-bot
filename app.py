from fastapi import FastAPI, Request
from functions.utils.whatsapp_api import send_whatsapp_message
from functions.utils.openrouter_api import get_openrouter_reply
from functions.utils.escalation import should_escalate
from firebase_admin import firestore, initialize_app, credentials
import firebase_admin
import os, json
from fastapi.responses import JSONResponse

# Correct initialization check
firebase_json = os.environ.get("FIREBASE_CONFIG_JSON")
if not firebase_json:
    raise Exception("FIREBASE_CONFIG_JSON is missing!")

cred = credentials.Certificate(json.loads(firebase_json))
initialize_app(cred)

db = firestore.client()
app = FastAPI()

@app.get("/")
def root():
    return {"status": "BeautyBot está en línea 💄🤖"}

@app.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == "beauty-bot-token"
    ):
        return int(params.get("hub.challenge"))
    return {"error": "Unauthorized"}, 403

@app.post("/webhook")
async def receive_message(request: Request):
    try:
        data = await request.json()
        message_data = data["entry"][0]["changes"][0]["value"]["messages"][0]
        phone = message_data["from"]
        text = message_data.get("text", {}).get("body", "")

        # Bot pause check
        paused_doc = db.collection("bot_paused").document(phone).get()
        if paused_doc.exists and paused_doc.to_dict().get("paused", False):
            print(f"⏸️ Bot paused for {phone}")
            return {"status": "bot paused"}

        # Save user message
        db.collection("chats").document(phone).collection("messages").add({
            "sender": "user",
            "message": text,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        # Decide reply
        if should_escalate(text):
            reply = "En un momento te contactamos con una persona del equipo 💬"
        else:
            reply = await get_openrouter_reply(text)

        # Save bot reply
        db.collection("chats").document(phone).collection("messages").add({
            "sender": "bot",
            "message": reply,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        await send_whatsapp_message(phone, reply)
        return {"status": "message sent"}

    except Exception as e:
        print("❌ Error in /webhook:", e)
        return {"error": str(e)}, 500

@app.post("/send")
async def send_admin_message(data: dict):
    phone = data.get("phone")
    message = data.get("message")

    if not phone or not message:
        return {"error": "Missing phone or message"}, 400

    await send_whatsapp_message(phone, message)

    db.collection("chats").document(phone).collection("messages").add({
        "sender": "admin",
        "message": message,
        "timestamp": firestore.SERVER_TIMESTAMP,
    })

    return {"status": "admin message sent"}

@app.post("/toggle-bot/{phone}")
async def toggle_bot(phone: str):
    doc_ref = db.collection("bot_paused").document(phone)
    current = doc_ref.get().to_dict() or {}
    new_status = not current.get("paused", False)
    doc_ref.set({"paused": new_status})
    return {"phone": phone, "bot_paused": new_status}

@app.get("/firebase-config")
def firebase_config():
    return JSONResponse({
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MSG_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
    })
