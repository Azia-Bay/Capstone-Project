from fastapi import FastAPI
from bluesky import RealTimeData
import uvicorn
import spacy
from geopy.geocoders import Nominatim
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
import mysql.connector
from mysql.connector import errorcode
import torch
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
    # "   `state` VARCHAR(10),"
    # "   `city` VARCHAR(100),"
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
time.sleep(1)
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
    return (getLoc.latitude, getLoc.longitude) if getLoc else None


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
            
async def datas_generator():


@app.get('/real-time-data')
def get_real_time_data():
    pass

def load_model(model_path):
    model = torch.load(model_path, map_location=torch.device('cpu'))
    model.eval() # set the model to evaluation model
    return model

model = load_model("/app/best_disaster_model.pt")

real_time = RealTimeData()
@app.post("/process-data")
def process_data():
    print("I get hit")
    # get real time tweets
    data = real_time.get_all()
   
    disaster_query = "" # INSERT INTO tbl_name (a,b,c) VALUES
    non_disaster_query = "" 
    for tweet in data:
        # Call Spacy Function to get location.
        location = locate(tweet)
        if location is None:
            continue
        (latitude, longitude) = coordinates(location=location)
        print(tweet, latitude, longitude)
        if latitude is None or longitude is None:
            continue
        # Call geopy library to get latitude and longitude
        # Call Model to classify the tweet
        disaster = model(tweet)
        if disaster == 0:
            non_disaster_query += "({tweet}), "
        else:
            disaster_query += "({tweet}, {disaster}, {latitude}, {longitude}), "
        # append Value to query
    # make an insert call to database
    if disaster_query != "":
        disaster_query = disaster_query[:len(disaster_query)-2]
        disaster_query += ";"
        disaster_query = "INSERT INTO `disaster_data` (tweet, model, latitude, longitude) VALUES " + disaster_query
        cursor.execute(disaster_query)

    if non_disaster_query != "":
        non_disaster_query = non_disaster_query[:len(non_disaster_query)-2]
        non_disaster_query += ";"
        non_disaster_query = "INSERT INTO `disaster_data` (tweet) VALUES " + non_disaster_query
        cursor.execute(non_disaster_query)
    cnx.commit()
    
    return 201

if __name__ == "__main__":
    # cron = CronTab(user="root")
    # job = cron.new(command='python /app/src/call_process_data.py')
    # job.minute.every(1)
    # cron.write()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")