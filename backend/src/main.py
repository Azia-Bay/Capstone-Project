from fastapi import FastAPI
from bluesky import RealTimeData
import sys
import uvicorn
import spacy
from geopy.geocoders import Nominatim
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
import mysql.connector
from mysql.connector import errorcode
import torch
import torch.nn as nn
from predictor import DisasterPredictor
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, bidirectional, dropout, pad_idx):
        super().__init__()
        
        # Embedding layer
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        
        # LSTM layer
        self.lstm = nn.LSTM(embedding_dim, 
                           hidden_dim, 
                           num_layers=n_layers, 
                           bidirectional=bidirectional, 
                           dropout=dropout if n_layers > 1 else 0,
                           batch_first=True)
        
        # Dropout layer
        self.dropout = nn.Dropout(dropout)
        
        # Fully connected layer
        fc_input_dim = hidden_dim * 2 if bidirectional else hidden_dim
        self.fc = nn.Linear(fc_input_dim, output_dim)
        
    def forward(self, text):
        # text shape: [batch size, sentence length]
        
        # Generate embeddings
        embedded = self.embedding(text)  # shape: [batch size, sentence length, embedding dim]
        
        # Pass through LSTM
        output, (hidden, cell) = self.lstm(embedded)
        
        # Extract the final forward and backward hidden states if bidirectional
        if self.lstm.bidirectional:
            hidden = torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1)
        else:
            hidden = hidden[-1,:,:]
        
        # Apply dropout
        hidden = self.dropout(hidden)
        
        # Pass through linear layer
        output = self.fc(hidden)
        
        return output
torch.serialization.add_safe_globals([LSTMClassifier])
torch.serialization.add_safe_globals([nn.Embedding])
torch.serialization.add_safe_globals([nn.LSTM])
torch.serialization.add_safe_globals([nn.Dropout])
torch.serialization.add_safe_globals([nn.Linear])
import numpy as np
from asyncio import sleep
import json
from transformers import pipeline
# use Celery for cron job in the future.
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLES ={}

TABLES['disaster_data'] = (
    "CREATE TABLE `disaster_data` ("
    "   `tweet_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,"
    "   `tweet` VARCHAR(500) NOT NULL,"
    "   `model` enum('1', '2', '3', '4', '5') NOT NULL,"
    "   `state` VARCHAR(100),"
    "   `city` VARCHAR(100),"
    "   `latitude` VARCHAR(100),"
    "   `longitude` VARCHAR(100),"
    "   `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ") ENGINE=InnoDB;"
)


TABLES['non_disaster_data'] = (
    "CREATE TABLE `non_disaster_data` ("
    "   `tweet_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,"
    "   `tweet` VARCHAR(500) NOT NULL"
    ") ENGINE=InnoDB;"
)

DB_NAME = "crisis_nlp_db"
time.sleep(2)
cnx = mysql.connector.connect(
  host="db"
)

cursor = cnx.cursor()

def create_database(cursor):
    try:
        cursor.execute(
            "CREATE DATABASE {} DEFAULT CHARACTER SET 'utf8'".format(DB_NAME))
    except mysql.connector.Error as err:
        print("Failed creating database: {}".format(err))
        exit(1)

try:
    cursor.execute("USE {}".format(DB_NAME))
except mysql.connector.Error as err:
    print("Database {} does not exists.".format(DB_NAME))
    if err.errno == errorcode.ER_BAD_DB_ERROR:
        create_database(cursor)
        print("Database {} created successfully.".format(DB_NAME))
        cnx.database = DB_NAME
    else:
        print(err)
        exit(1)

for table_name in TABLES:
    table_description = TABLES[table_name]
    try:
        print("Creating table {}: ".format(table_name), end='')
        cursor.execute(table_description)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
            print("already exists.")
        else:
            print(err.msg)
    else:
        print("OK")

@app.get("/")
def read_root():
    return {"Hello": "World"}

# takes in a argument of text and returns an Optional max_gpe
def extract_locations(text):
    nlp = spacy.load('en_core_web_trf')

    text = text.upper()
    doc = nlp(text)
    locations = {}
    for item in doc.ents:
        if item.label_ == 'GPE':
            locations[item.text] = locations.get(item.text, 0) + 1
    return locations if locations else None
    
def classify_relevant_state(text, locations):
    if not locations:
        return None

    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    # Run zero-shot classification with locations as candidate labels
    result = classifier(text, candidate_labels=list(locations.keys()))
    return result["labels"][0]  # Return the highest-ranked location
    
def locate_disaster(text, locations):
    if not locations:
        return None, None

    #US states to detect
    us_states = {
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
    }
    
    #Get the most mentioned location
    if len(locations) > 1:
        most_mentioned = classify_relevant_state(text, locations)
    else:
        most_mentioned = max(locations, key=locations.get)

    #If it's a state, return
    if most_mentioned in us_states:
        return most_mentioned, most_mentioned 
    
    #Get state if we only have a city name using Geopy
    geolocator = Nominatim(user_agent="GetLoc")
    location = geolocator.geocode(most_mentioned)
    if location:
        address = location.address.split(", ")
        for part in address:
            if part in us_states:
                return most_mentioned, part

    return most_mentioned, None
    
# Gives (latitude, longitude) from argument location <- result of locate(text)
def get_coordinates(location):
    loc = Nominatim(user_agent="GetLoc")
    getLoc = loc.geocode(location)
    return (getLoc.latitude, getLoc.longitude) if getLoc else None, None


@app.get("/all-data")
def get_all_data():
    cursor.execute("SELECT * FROM disaster_data")
    # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
    res = cursor.fetchall()
    
    data = []
    for row in res:
        temp = {}
        temp["tweet_id"] = row[0]
        temp["tweet"] = row[1]
        temp["model"] = row[2]
        temp["latitude"] = row[3]
        temp["longitude"] = row[4]
        temp["timestamp"] = row[5]
        data.append(temp)
    return data

# @app.get("/datatime")


def load_model(model_path):
    model = torch.load(model_path).to(device)
    model.eval() # set the model to evaluation model
    return model

def tokenize(text):
    max_length = self.config['max_length']
    words = text.split()
    tokens = [self.word_to_idx.get(word, self.word_to_idx['<UNK>']) for word in words]
    
    # Pad or truncate
    if len(tokens) < max_length:
        tokens = tokens + [self.word_to_idx['<PAD>']] * (max_length - len(tokens))
    else:
        tokens = tokens[:max_length]
    
    return tokens
model = DisasterPredictor(model_dir="/app/src/disaster_model")
real_time = RealTimeData()
async def data_generator():
    print("I get hit")
    while(True):
        # get real time tweets
        data = real_time.get_all()
        print(data)
        disaster_query = "" # INSERT INTO tbl_name (a,b,c) VALUES
        non_disaster_query = "" 
        return_data = []
        for tweet in data:
            # Call Spacy Function to get location.
            print(tweet)
            result = model.predict(tweet)
            disaster = result['predicted_class']
            if disaster == 0:
                non_disaster_query += f"({tweet}), "
                continue
            city, state = locate_disaster(tweet, extract_locations(tweet))
            await sleep(1)
            print(f"I get here {city} {state}")
            if city is None:
                continue
            
            (latitude, longitude) = get_coordinates(location=city)
            if city == state:
                city = None
            if latitude is None or longitude is None:
                continue
            # Call geopy library to get latitude and longitude
            # Call Model to classify the tweet
            print(tweet, latitude, longitude, city, state, disaster)
            disaster_query += f"({tweet}, {disaster}, {state}, {city}, {latitude}, {longitude}), "
            return_data.append({"tweet":tweet, "disaster":disaster, "state":state, "city":city, "latitude":latitude, "longitude":longitude})
            # append Value to query
        # make an insert call to database
        if disaster_query != "":
            disaster_query = disaster_query[:len(disaster_query)-2]
            disaster_query += ";"
            disaster_query = "INSERT INTO `disaster_data` (tweet, model, state, city, latitude, longitude) VALUES " + disaster_query
            cursor.execute(disaster_query)

        if non_disaster_query != "":
            non_disaster_query = non_disaster_query[:len(non_disaster_query)-2]
            non_disaster_query += ";"
            non_disaster_query = "INSERT INTO `disaster_data` (tweet) VALUES " + non_disaster_query
            cursor.execute(non_disaster_query)
        cnx.commit()
        json_data = json.dumps(return_data)
        yield f"event: newTweets\ndata: {json_data}\n\n"
        await sleep(60)

async def waypoints_generator():
    waypoints = [{"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249}, {"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249},{"latitude":102.193, "longitude":-120.249}]
    # waypoints = json.load(waypoints)
    for waypoint in waypoints[0: 10]:
        print(f"{waypoint}")
        data = json.dumps(waypoint)
        yield f"event: newTweets\ndata: {data}\n\n"
        await sleep(1)
@app.get("/stream")
async def stream():
    return StreamingResponse(data_generator(), media_type="text/event-stream")

@app.get('/real-time-data')
def get_real_time_data():
    pass




# @app.post("/process-data")
# def process_data():
#     print("I get hit")
#     # get real time tweets
#     data = real_time.get_all()
   
#     disaster_query = "" # INSERT INTO tbl_name (a,b,c) VALUES
#     non_disaster_query = "" 
#     for tweet in data:
#         # Call Spacy Function to get location.
#         location = locate(tweet)
#         if location is None:
#             continue
#         (latitude, longitude) = coordinates(location=location)
#         print(tweet, latitude, longitude)
#         if latitude is None or longitude is None:
#             continue
#         # Call geopy library to get latitude and longitude
#         # Call Model to classify the tweet
#         disaster = model(tweet)
#         if disaster == 0:
#             non_disaster_query += "({tweet}), "
#         else:
#             disaster_query += "({tweet}, {disaster}, {latitude}, {longitude}), "
#         # append Value to query
#     # make an insert call to database
#     if disaster_query != "":
#         disaster_query = disaster_query[:len(disaster_query)-2]
#         disaster_query += ";"
#         disaster_query = "INSERT INTO `disaster_data` (tweet, model, latitude, longitude) VALUES " + disaster_query
#         cursor.execute(disaster_query)

#     if non_disaster_query != "":
#         non_disaster_query = non_disaster_query[:len(non_disaster_query)-2]
#         non_disaster_query += ";"
#         non_disaster_query = "INSERT INTO `disaster_data` (tweet) VALUES " + non_disaster_query
#         cursor.execute(non_disaster_query)
#     cnx.commit()
    
#     return 201

if __name__ == "__main__":
    # cron = CronTab(user="root")
    # job = cron.new(command='python /app/src/call_process_data.py')
    # job.minute.every(1)
    # cron.write()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")