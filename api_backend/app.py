from flask import Flask, request, jsonify
from transformers import BertTokenizer, BertForSequenceClassification
import torch
import torch.nn.functional as F
import spacy
import os

app = Flask(__name__)

# === Load BETO model ===
bert_path = os.path.abspath("./bert_intent_classifier/beto-intents")
tokenizer = None
model = None
id2label = {}

try:
    tokenizer = BertTokenizer.from_pretrained(bert_path)
    model = BertForSequenceClassification.from_pretrained(bert_path)
    model.eval()
except Exception as e:
    raise RuntimeError(f"❌ Failed to load BERT model from {bert_path}: {e}")

# === Load intent labels ===
labels_file = os.path.join(bert_path, "labels.txt")
try:
    with open(labels_file, encoding="utf-8") as f:
        for line in f:
            idx, label = line.strip().split(",")
            id2label[int(idx)] = label
except Exception as e:
    raise RuntimeError(f"❌ Failed to load labels.txt: {e}")

# === Load spaCy NER model ===
spacy_path = os.path.abspath("./spacy_ner_training/model/model-last")
try:
    nlp = spacy.load(spacy_path)
except Exception as e:
    raise RuntimeError(f"❌ Failed to load spaCy model from {spacy_path}: {e}")

@app.route("/predict-intent", methods=["POST"])
def predict_intent():
    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
        if not text:
            return jsonify(error="Text is required."), 400

        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
            probs = F.softmax(outputs.logits, dim=1)
            conf, pred = torch.max(probs, dim=1)
            intent = id2label.get(pred.item(), "unknown")
            prob_dict = {id2label.get(i, str(i)): round(prob.item(), 4) for i, prob in enumerate(probs[0])}

        return jsonify(intent=intent, confidence=round(conf.item(), 4), probabilities=prob_dict)
    except Exception as e:
        return jsonify(error=f"Intent prediction failed: {str(e)}"), 500

@app.route("/predict-slots", methods=["POST"])
def predict_slots():
    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
        if not text:
            return jsonify(error="Text is required."), 400

        doc = nlp(text)
        entities = [{
            "text": ent.text,
            "start_char": ent.start_char,
            "end_char": ent.end_char,
            "label": ent.label_
        } for ent in doc.ents]

        return jsonify(text=text, entities=entities)
    except Exception as e:
        return jsonify(error=f"Slot extraction failed: {str(e)}"), 500

@app.route("/")
def healthcheck():
    return "✅ BeautyBot is alive."

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
