import torch
from transformers import BertTokenizer, BertForSequenceClassification
import os

# Load model and tokenizer
model_dir = "./beto-intents"
tokenizer = BertTokenizer.from_pretrained(model_dir)
model = BertForSequenceClassification.from_pretrained(model_dir)
model.eval()

# Load label mappings
id2label = {}
with open(os.path.join(model_dir, "labels.txt"), encoding="utf-8") as f:
    for line in f:
        idx, label = line.strip().split(",", 1)
        id2label[int(idx)] = label

def predict_intent(text):
    # Tokenize input
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)

    # Run model
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1)
        predicted_class_id = torch.argmax(probs, dim=1).item()
        confidence = probs[0][predicted_class_id].item()

    return {
        "intent": id2label[predicted_class_id],
        "confidence": round(confidence, 4)
    }

# Test
if __name__ == "__main__":
    test_input = input("Escribe una frase para probar el modelo: ")
    result = predict_intent(test_input)
    print(f"\n🔎 Predicción: {result['intent']} (confianza: {result['confidence'] * 100:.2f}%)")
