import aiohttp
import os

# Load from Render
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")

async def send_whatsapp_message(phone_number: str, message: str):
    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message
        }
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                result = await response.json()
                if response.status == 200:
                    print(f"✅ WhatsApp message sent to {phone_number}")
                else:
                    print(f"⚠️ Failed to send WhatsApp message: {result}")
    except Exception as e:
        print(f"❌ WhatsApp send error: {e}")
