import mysql.connector
import json
from bluesky import RealTimeData
from predictor import DisasterPredictor, LSTMClassifier
from time import sleep
from geopy.geocoders import Nominatim
from shapely.geometry import Point
import geopandas as gpd
import spacy
from transformers import pipeline
import re
from time import sleep
print("DATA PROCESSING IS RUNNING")

DB_NAME = "crisis_nlp_db"
cnx = mysql.connector.connect(
  host="db",
  autocommit=True
)

cursor = cnx.cursor()

cursor.execute("USE {}".format(DB_NAME))
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

def is_within_us(latitude, longitude):
    # Check if the coordinates are within the U.S. boundaries.
    point = Point(longitude, latitude)
    return us_map.geometry.contains(point).any()
# def load_model(model_path):
#     model = torch.load(model_path).to(device)
#     model.eval() # set the model to evaluation model
#     return model

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
coordinates_cache = {}
coordinates_cache[None] = (None, None)
def data_generator():
    while(True):
        # get real time tweets
        data = []
        try:
            data = real_time.get_all()
        except:
            print("FAILED TO FETCH DATA FROM BLUESKY, GOING TO SLEEP FOR 5 MINUTES")
            sleep(300)
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
            city, state = (None, None)
            while True:
                try:
                    city, state = locate_disaster(tweet, extract_locations(tweet))
                    break
                except:
                    print("FAILED NOMINATIM, GOING TO SLEEP FOR 1 MINUTE")
                    sleep(60)
            sleep(1)
            print(f"I get here {city} {state}")
            # if city is None:
            #     continue
            coordinates = () 
            if city in coordinates_cache:
                coordinates = coordinates_cache[city]
            else:
                while True:
                    try:
                        coordinates = get_coordinates(location=city)
                        coordinates_cache[city] = coordinates
                    except:
                        print("FAILED GEOPY, GOING TO SLEEP FOR 1 MINUTE")
                        sleep(60)
            latitude, longitude = coordinates[0], coordinates[1]
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
            # return_data.append({"tweet":tweet, "disaster":disaster, "state":state, "city":city, "latitude":latitude, "longitude":longitude})
            # append Value to query
        # make an insert call to database
        # reconnect to DB if connection drops
        cnx.ping(reconnect=True, attempts=2, delay=2)
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
        if len(data) < 10:
            sleep(60)
        # json_data = json.dumps(return_data)
        # yield f"event: newTweets\ndata: {json_data}\n\n"    

data_generator()