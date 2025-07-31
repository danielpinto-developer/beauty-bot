import pandas as pd
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    Trainer,
    TrainingArguments
)
from datasets import Dataset
import torch
import os

# Check GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load and prepare CSV
df = pd.read_csv("train_final.csv")
df = df.drop_duplicates().dropna()
df = df.sample(frac=1).reset_index(drop=True)  # Shuffle

# Label encoding
label2id = {label: i for i, label in enumerate(sorted(df["intent"].unique()))}
id2label = {i: label for label, i in label2id.items()}
df["label"] = df["intent"].map(label2id)

# Convert to HuggingFace Dataset
dataset = Dataset.from_pandas(df[["text", "label"]])

# Load tokenizer and model
model_name = "dccuchile/bert-base-spanish-wwm-cased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(label2id),
    id2label=id2label,
    label2id=label2id,
)
model.to(device)

# Tokenize text
def tokenize(batch):
    return tokenizer(batch["text"], padding="max_length", truncation=True)

dataset = dataset.map(tokenize, batched=True)
dataset = dataset.train_test_split(test_size=0.1)
dataset.set_format(type='torch', columns=['input_ids', 'attention_mask', 'label'])

# Training configuration
training_args = TrainingArguments(
    output_dir="./beto-intents",
    evaluation_strategy="epoch",         
    save_strategy="epoch",               
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=5,
    save_total_limit=2,
    logging_steps=10,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    logging_dir="./logs",
)

# Define Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
)

# Train the model
trainer.train()

# Save model + tokenizer
os.makedirs("./beto-intents", exist_ok=True)
model.save_pretrained("./beto-intents")
tokenizer.save_pretrained("./beto-intents")

# Save label mappings
with open("./beto-intents/labels.txt", "w", encoding="utf-8") as f:
    for label, idx in label2id.items():
        f.write(f"{idx},{label}\n")

print("✅ Model and tokenizer saved in ./beto-intents")
