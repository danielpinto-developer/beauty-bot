import torch
from transformers import BertTokenizer, BertForSequenceClassification
import torch.nn.functional as F
import pandas as pd
import os

# Load model and tokenizer
model_path = "./beto-intents"
tokenizer = BertTokenizer.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)
model.eval()

# Load label map
label_map_path = os.path.join(model_path, "labels.txt")
label_map = {}
with open(label_map_path, encoding="utf-8") as f:
    for line in f:
        idx, label = line.strip().split(",")
        label_map[int(idx)] = label

# Predict function
def predict_intent(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = F.softmax(logits, dim=1)
        confidence, predicted_class = torch.max(probs, dim=1)
        intent = label_map[predicted_class.item()]
        return {
            "intent": intent,
            "confidence": round(confidence.item(), 4),
            "probabilities": {label_map[i]: round(prob, 4) for i, prob in enumerate(probs[0])}
        }

# Example usage
if __name__ == "__main__":
    msg = "Quiero agendar para pestañas volumen el sábado"
    result = predict_intent(msg)
    print(result)
