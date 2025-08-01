from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from firebase_admin import firestore, initialize_app, credentials
from whatsapp import send_whatsapp_message
from openrouter import get_openrouter_reply
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
        message_data = data["entry"][0]["changes"][0]["value"]["messages"][0]
        phone = message_data["from"]
        text = message_data.get("text", {}).get("body", "")

        paused_doc = db.collection("bot_paused").document(phone).get()
        if paused_doc.exists and paused_doc.to_dict().get("paused", False):
            return {"status": "bot paused"}

        db.collection("chats").document(phone).collection("messages").add({
            "sender": "user",
            "message": text,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        # 🚀 Call BERT (Cloud Run) to get intent
        intent_response = requests.post(
            "https://beautybot-api-320221601178.us-central1.run.app/predict-intent",
            json={"text": text}
        ).json()

        intent = intent_response.get("intent")

        if intent == "escalate_to_human":
            reply = "En un momento te contactamos con una persona del equipo 💬"
        else:
            reply = await get_openrouter_reply(text)

        db.collection("chats").document(phone).collection("messages").add({
            "sender": "bot",
            "message": reply,
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        await send_whatsapp_message(phone, reply)
        return {"status": "message sent"}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/send")
async def send_admin_message(data: dict):
    phone = data.get("phone")
    message = data.get("message")

    if not phone or not message:
        return JSONResponse(content={"error": "Missing phone or message"}, status_code=400)

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
