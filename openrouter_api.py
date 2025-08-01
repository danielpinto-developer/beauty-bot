# openrouter_api.py
import os
import requests

system_prompt = """
Eres BeautyBot, la asistente profesional y cálida de bb27 Studio (Beauty Blossoms), un salón en Zapopan, Jalisco.

Tu única función es dar información sobre nuestros servicios: pestañas, uñas, cejas, enzimas, depilación, cabello, etc.

Si te preguntan por precios, responde con los precios del salón. Nunca hables de tiendas, Amazon ni productos externos.

Siempre escribe en español, con un tono natural, humano y profesional. Usa máximo 3 oraciones. Puedes incluir un emoji cálido si aplica.

Siempre que des un precio, menciona que es en bb27 Studio y pregunta: "¿Qué día te gustaría agendar tu cita?" Nunca confirmes. Solo responde: "En unos momentos confirmamos la disponibilidad de tu cita ✨" si ya tienen fecha/hora.
"""

def get_openrouter_reply(user_text):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not set")
        return "Lo siento, no tengo acceso a OpenRouter en este momento."

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "mistral/mistral-7b-instruct",  # ✅ Switched to supported model
        "temperature": 0.4,
        "max_tokens": 120,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": user_text.strip()
                + "\n\nRecuerda: solo responde con servicios de Beauty Blossoms. No hables de Amazon, productos o salones externos. Sé breve.",
            },
        ],
    }

    try:
        res = requests.post(url, headers=headers, json=body)
        if res.status_code != 200:
            print("❌ OpenRouter raw response:", res.text)
            res.raise_for_status()
        data = res.json()

        # Parse message content safely
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        # Limit to 3 sentences max
        sentences = content.split(". ")
        reply = ". ".join(sentences[:3]).strip()
        return reply or "Lo siento, no entendí eso."

    except requests.exceptions.RequestException as e:
        print("❌ OpenRouter API error:", e)
        return "Lo siento, hubo un error al procesar tu mensaje con la inteligencia artificial 🤖"
