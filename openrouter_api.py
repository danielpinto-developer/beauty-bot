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
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "openrouter/mistralai/mixtral-8x7b-instruct",
        "temperature": 0.4,
        "max_tokens": 120,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": user_text
                + "\n\nRecuerda: solo responde con servicios de Beauty Blossoms. No hables de Amazon, productos o salones externos. Sé breve.",
            },
        ],
    }

    res = requests.post(url, headers=headers, json=body)
    res.raise_for_status()
    data = res.json()
    raw = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "Lo siento, no entendí eso.")
        .strip()
    )

    # Limit to max 3 sentences
    sentences = raw.split(". ")
    return ". ".join(sentences[:3]).strip()
