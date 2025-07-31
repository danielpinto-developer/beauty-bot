import spacy
import sys
import json

# Load the trained model
nlp = spacy.load("output/model-last")

def predict(text):
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "start_char": ent.start_char,
            "end_char": ent.end_char,
            "label": ent.label_,
        })
    return entities

if __name__ == "__main__":
    # Accept text input as command line argument or use default
    input_text = sys.argv[1] if len(sys.argv) > 1 else "Quiero una cita para hidraterapia mañana a las 4:15"
    ents = predict(input_text)
    output = {
        "text": input_text,
        "entities": ents,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
