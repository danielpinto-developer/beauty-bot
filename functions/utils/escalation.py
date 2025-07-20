ESCALATION_KEYWORDS = [
    "hablar con alguien",
    "persona real",
    "humano",
    "no quiero bot",
    "necesito ayuda",
    "me puedes llamar",
    "me urge",
    "quiero cancelar todo",
    "alguien que me atienda",
    "soporte",
    "ayuda humana",
    "ya basta",
    "no entiendes",
    "quiero una persona",
    "esto no sirve",
]

def should_escalate(message: str) -> bool:
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in ESCALATION_KEYWORDS)
