import os
import pickle
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import re

class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, bidirectional, dropout, pad_idx):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        self.lstm = nn.LSTM(embedding_dim, 
                           hidden_dim, 
                           num_layers=n_layers, 
                           bidirectional=bidirectional, 
                           dropout=dropout if n_layers > 1 else 0,
                           batch_first=True)
        self.dropout = nn.Dropout(dropout)
        fc_input_dim = hidden_dim * 2 if bidirectional else hidden_dim
        self.fc = nn.Linear(fc_input_dim, output_dim)
        
    def forward(self, text):
        embedded = self.embedding(text)  # shape: [batch size, sentence length, embedding dim]
        output, (hidden, cell) = self.lstm(embedded)
        if self.lstm.bidirectional:
            hidden = torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1)
        else:
            hidden = hidden[-1,:,:]
        hidden = self.dropout(hidden)
        output = self.fc(hidden)
        return output

class DisasterPredictor:
    def __init__(self, model_dir='./disaster_model'):
        # Load configuration
        with open(os.path.join(model_dir, 'model_config.json'), 'r') as f:
            self.config = json.load(f)
        
        # Load vocabulary
        with open(os.path.join(model_dir, 'vocab.pkl'), 'rb') as f:
            self.vocab = pickle.load(f)
            
        with open(os.path.join(model_dir, 'word_to_idx.pkl'), 'rb') as f:
            self.word_to_idx = pickle.load(f)
            
        with open(os.path.join(model_dir, 'disaster_types.json'), 'r') as f:
            self.disaster_types = json.load(f)
        
        # Initialize model
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = LSTMClassifier(
            self.config['vocab_size'], 
            self.config['embedding_dim'], 
            self.config['hidden_dim'], 
            self.config['output_dim'], 
            self.config['n_layers'], 
            self.config['bidirectional'], 
            self.config['dropout'], 
            self.config['pad_idx']
        )
        
        torch.serialization.add_safe_globals([LSTMClassifier])
        self.model = torch.load(
            os.path.join(model_dir, 'model_full.pt'),
            map_location=self.device,
            weights_only=False
        )
        
        self.model.to(self.device)
        self.model.eval()
    
    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        text = re.sub(r'@\w+|#\w+', '', text)
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\d+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def tokenize(self, text):
        max_length = self.config['max_length']
        words = text.split()
        tokens = [self.word_to_idx.get(word, self.word_to_idx['<UNK>']) for word in words]
        
        # Pad or truncate
        if len(tokens) < max_length:
            tokens = tokens + [self.word_to_idx['<PAD>']] * (max_length - len(tokens))
        else:
            tokens = tokens[:max_length]
        
        return tokens
    
    def predict(self, text):
        # Clean and tokenize
        cleaned_text = self.clean_text(text)
        tokens = self.tokenize(cleaned_text)
        
        # Convert to tensor
        tensor = torch.LongTensor([tokens]).to(self.device)
        
        # Get prediction
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = F.softmax(outputs, dim=1)
            predicted_class = outputs.argmax(dim=1).item()
            confidence = probabilities[0][predicted_class].item()
        
        return {
            'text': text,
            'predicted_class': predicted_class,
            'disaster_type': self.disaster_types[predicted_class],
            'confidence': confidence * 100,
            'probabilities': {self.disaster_types[i]: prob.item() * 100 for i, prob in enumerate(probabilities[0])}
        }

# Test the predictor pipeline
# print("\nTesting prediction pipeline...")
# predictor = DisasterPredictor()

# example_tweets = [
#     "Earthquake just hit the city! Buildings are shaking and people are running outside.",
#     "The river has overflowed and many streets are now underwater. #flooding",
#     "Hurricane warning in effect for the coastal areas. Everyone please evacuate.",
#     "Just saw a tornado touch down near the highway. It's moving east quickly.",
#     "The wildfire is spreading rapidly due to strong winds. Fire crews are responding.",
#     "Just had a great lunch at the new restaurant downtown. Would recommend!"
# ]

# for tweet in example_tweets:
#     result = predictor.predict(tweet)
#     print(f"Text: {result['text']}")
#     print(f"Predicted: {result['disaster_type']} (Class {result['predicted_class']})")
#     print(f"Confidence: {result['confidence']:.2f}%")
#     print("Probabilities:")
#     for disaster_type, prob in result['probabilities'].items():
#         print(f"  {disaster_type}: {prob:.2f}%")
#     print("-" * 80)