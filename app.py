from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from firebase_admin import firestore, initialize_app, credentials
from whatsapp_api import send_whatsapp_message
from openrouter_api import get_openrouter_reply
import firebase_admin
import os, json, requests

app = FastAPI()

# Firebase Admin Init
firebase_json = os.environ.get("FIREBASE_CONFIG_JSON")
if not firebase_json:
    raise Exception("FIREBASE_CONFIG_JSON is missing!")

cred = credentials.Certificate(json.loads(firebase_json))
initialize_app(cred)
db = firestore.client()

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
    return JSONResponse(content={"error": "Unauthorized"}, status_code=403)

@app.post("/webhook")
async def receive_message(request: Request):
    try:
        data = await request.json()
        print("📥 Incoming webhook data:", data)

        entry = data.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            print("⚠️ No 'messages' in payload")
            return {"status": "no messages"}

        message_data = messages[0]
        phone = message_data.get("from")
        text = message_data.get("text", {}).get("body", "")

        if not phone or not text:
            print("⚠️ Missing phone or text:", phone, text)
            return {"status": "invalid message"}

        # Check if bot is paused
        paused_doc = db.collection("bot_paused").document(phone).get()
        if paused_doc.exists and paused_doc.to_dict().get("paused", False):
            print("⏸️ Bot is paused for", phone)
            return {"status": "bot paused"}

        # Log user message
        db.collection("chats").document(phone).collection("messages").add({
            "sender": "user",
            "message": text,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        # Get intent
        try:
            intent_response = requests.post(
                "https://beautybot-api-320221601178.us-central1.run.app/predict-intent",
                json={"text": text}
            )
            intent_response.raise_for_status()
            intent = intent_response.json().get("intent")
        except Exception as bert_err:
            print("❌ Error calling BERT intent:", str(bert_err))
            intent = None

        # Decide reply
        if intent == "escalate_to_human":
            reply = "En un momento te contactamos con una persona del equipo 💬"
        else:
            try:
                reply = get_openrouter_reply(text)
            except Exception as or_err:
                print("❌ Error calling OpenRouter:", str(or_err))
                reply = "Lo siento, ocurrió un error al generar la respuesta 🤖"

        # Log bot reply
        db.collection("chats").document(phone).collection("messages").add({
            "sender": "bot",
            "message": reply,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        # ❗ FIXED: Don't await a sync function!
        send_whatsapp_message(phone, reply)

        return {"status": "message sent"}

    except Exception as e:
        print("❌ Uncaught webhook error:", str(e))
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/send")
async def send_admin_message(data: dict):
    phone = data.get("phone")
    message = data.get("message")

    if not phone or not message:
        return JSONResponse(content={"error": "Missing phone or message"}, status_code=400)

    # ❗ FIXED: Don't await a sync function!
    send_whatsapp_message(phone, message)

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
