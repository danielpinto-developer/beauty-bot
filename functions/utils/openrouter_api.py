import aiohttp
import os

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "openrouter/mistralai/mixtral-8x7b-instruct"

async def get_openrouter_reply(user_message: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    system_prompt = (
        "Eres BeautyBot, una asistente amable y profesional de Beauty Blossoms, un salón de belleza en Zapopan, México. "
        "Tu tarea es ayudar a las clientas con información sobre servicios como pestañas, uñas, cejas, enzimas, cabello, micropigmentación, depilaciones, y más. "
        "Haz preguntas para completar la información necesaria como fecha, hora y servicio antes de agendar. "
        "Nunca confirmes una cita automáticamente. En vez de eso, dile: 'En unos momentos confirmamos la disponibilidad de tu cita ✨'. "
        "Escribe de forma cálida, humana y con emojis. Nunca actúes como robot. Mantén la conversación en español."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload) as response:
                result = await response.json()
                reply = result["choices"][0]["message"]["content"]
                return reply.strip()
    except Exception as e:
        print("❌ Error with OpenRouter:", str(e))
        return "Lo siento, algo salió mal al generar la respuesta. Intenta de nuevo."
