from fastapi import FastAPI
from bluesky import RealTimeData
import uvicorn
import spacy
from geopy.geocoders import Nominatim
from shapely.geometry import Point
import geopandas as gpd
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
import mysql.connector
from mysql.connector import errorcode

import json
from asyncio import sleep
import os
import re
from predictor import DisasterPredictor, LSTMClassifier
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
    "   `tweet` VARCHAR(1000) NOT NULL,"
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
    "   `tweet` VARCHAR(1000) NOT NULL"
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
            "CREATE DATABASE {} DEFAULT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_general_ci'".format(DB_NAME))
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

# Load shapefile for US states
us_map = gpd.read_file("/app/src/shapely/ne_110m_admin_1_states_provinces.shp", encoding="utf-8")
# Only map US
us_map = us_map[us_map["admin"] == "United States of America"]

#US states to detect
state_abbreviations = {
"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
"CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
"HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
"KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
"MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
"MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
"NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
"ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
"RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
"TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
"WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
}

us_states = set(state_abbreviations.values())

def extract_hashtags(text):
    # Extracts potential location names from hashtags.
    return [tag[1:] for tag in re.findall(r"#\w+", text)]

# takes in a argument of text and returns an Optional max_gpe
def extract_locations(text):
    nlp = spacy.load('en_core_web_trf')

    #text = text.upper()
    doc = nlp(text)
    locations = {}
    for item in doc.ents:
        if item.label_ == 'GPE':
            #locations[item.text] = locations.get(item.text, 0) + 1
            # Convert state abbreviations
            loc_name = state_abbreviations.get(item.text, item.text) 
            locations[loc_name] = locations.get(loc_name, 0) + 1
    # Check hashtags for locations
    hashtags = extract_hashtags(text)
    for tag in hashtags:
        tag_doc = nlp(tag)
        for entity in tag_doc.ents:
            if entity.label_ == "GPE":
                loc_name = state_abbreviations.get(entity.text, entity.text)
                locations[loc_name] = locations.get(loc_name, 0) + 1

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
    if getLoc:
        if is_within_us(getLoc.latitude, getLoc.longitude):
            return getLoc.latitude, getLoc.longitude
    return None, None
    #latitude, longitude = getLoc.latitude, getLoc.longitude
    # Reject coordinates outside the US (based on a bounding box)
    #if 24.396308 <= latitude <= 49.384358 and -125.000000 <= longitude <= -66.934570:
        #return latitude, longitude

    #return None, None
    #return (getLoc.latitude, getLoc.longitude) if getLoc else None, None

def is_within_us(latitude, longitude):
    # Check if the coordinates are within the U.S. boundaries.
    point = Point(longitude, latitude)
    return us_map.geometry.contains(point).any()
"""
openai.api_key = os.getenv("OPENAI_API_KEY")
async def chatgpt_request(prompt):
    # Helper function to query the ChatGPT API.
    response = await asyncio.to_thread(openai.completions.create,
                                        model="gpt-4o",
                                        prompt=prompt)
    return response['choices'][0]['text']

async def chat_extract_locations(text):
    prompt = f"Extract all geographical locations (city, state) mentioned in this text: '{text}'. Return a JSON object like {{'locations': ['city1', 'state1', 'city2']}}."
    
    response = await chatgpt_request(prompt)
    try:
        data = json.loads(response)
        return data.get("locations", [])
    except json.JSONDecodeError:
        return None

async def chat_classify_relevant_state(text, locations):
    if not locations:
        return None

    prompt = f"Given the text: '{text}', determine the most relevant location from this list: {locations}. Return only the most relevant location."
    
    response = await chatgpt_request(prompt)
    return response.strip()

async def chat_locate_disaster(text):
    locations = await chat_extract_locations(text)
    if not locations:
        return None, None

    # Get the most relevant location
    most_relevant = await chat_classify_relevant_state(text, locations)

    # Use ChatGPT to determine the state if only the city is given
    prompt = f"Identify the U.S. state for the city '{most_relevant}'. If it's already a state, return it as is."
    
    response = await chatgpt_request(prompt)
    state = response.strip()
    
    return most_relevant, state

async def chat_get_coordinates(location):
    prompt = f"Provide latitude and longitude for '{location}' as a JSON object like {{'latitude': 00.000, 'longitude': 00.000}}."
    
    response = await chatgpt_request(prompt)
    try:
        data = json.loads(response)
        return data.get("latitude", None), data.get("longitude", None)
    except json.JSONDecodeError:
        return None, None
"""

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
        temp["state"] = row[3]
        temp["city"] = row[4]
        temp["latitude"] = row[5]
        temp["longitude"] = row[6]
        temp["timestamp"] = row[7]
        data.append(temp)
    return data

# @app.get("/datatime")

@app.get("/nondisaster-data")
def get_nondisaster_data():
    cursor.execute("SELECT * FROM non_disaster_data")
    # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
    res = cursor.fetchall()
    
    data = []
    for row in res:
        temp = {}
        temp["tweet_id"] = row[0]
        temp["tweet"] = row[1]
        data.append(temp)
    return data

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
            tweet = tweet.replace("'", "\\'")
            if disaster == 0:
                non_disaster_query += f"('{tweet}'), "
                continue
            city, state = locate_disaster(tweet, extract_locations(tweet))
            #city, state = await chat_locate_disaster(tweet)
            await sleep(1)
            print(f"I get here {city} {state}")
            # if city is None:
            #     continue
            coordinates = get_coordinates(location=city)
            latitude, longitude = coordinates[0], coordinates[1]
            #latitude, longitude = await chat_get_coordinates(city)
            if city == state:
                city = None
            if latitude is None or longitude is None:
                continue
            if city:
                city = city.replace("\\", "")
            if state:
                state = state.replace("\\", "")
            # Call geopy library to get latitude and longitude
            # Call Model to classify the tweet
            if city:
                city = city.replace("\\", "")
            if state:
                state = state.replace("\\", "")
            print(tweet, latitude, longitude, city, state, disaster)
            disaster_query += f"('{tweet}', {disaster}, '{state}', '{city}', '{latitude}', '{longitude}'), "
            return_data.append({"tweet":tweet, "disaster":disaster, "state":state, "city":city, "latitude":latitude, "longitude":longitude})
            # append Value to query
        # make an insert call to database
        if disaster_query != "":
            disaster_query = disaster_query[:len(disaster_query)-2]
            disaster_query += ";"
            disaster_query = "INSERT INTO `disaster_data` (tweet, model, state, city, latitude, longitude) VALUES " + disaster_query
            print(disaster_query)
            cursor.execute(disaster_query)

        if non_disaster_query != "":
            non_disaster_query = non_disaster_query[:len(non_disaster_query)-2]
            non_disaster_query += ";"
            non_disaster_query = "INSERT INTO `non_disaster_data` (tweet) VALUES " + non_disaster_query
            print(non_disaster_query)
            cursor.execute(non_disaster_query)
        cnx.commit()
        json_data = json.dumps(return_data)
        yield f"event: newTweets\ndata: {json_data}\n\n"
        await sleep(60)

@app.get("/stream")
async def stream():
    return StreamingResponse(data_generator(), media_type="text/event-stream")

@app.get('/real-time-data')
def get_real_time_data():
    pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")